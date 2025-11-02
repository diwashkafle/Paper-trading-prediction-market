import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus, OrderType } from './entities/order.entity';
import { DataSource, Repository, In, EntityManager } from 'typeorm';
import { MarketEventsService } from './market-events.service';
import { Trade } from './entities/trades.entity';
import { Holding } from 'src/portfolio/entities/holding.entity';
import { User } from 'src/user/entities/user.entity';
import { Event, EventStatus } from '../market-event/entities/event.entity';
import { PlaceOrderDto } from './dto/place-order.dto';

@Injectable()
export class LiveMarketService {
  private readonly logger = new Logger(LiveMarketService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(Holding)
    private readonly holdingRepository: Repository<Holding>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly marketEvents: MarketEventsService,
    private readonly dataSource: DataSource,
  ) {}

  private async runMatchingEngine(newOrder: Order) {
    const ordersToUpdate: Order[] = [newOrder];

    // 1. Determine which orders to fetch (the opposite side)
    const isBuyOrder = newOrder.type === OrderType.BUY;
    const oppositeOrderType = isBuyOrder ? OrderType.SELL : OrderType.BUY;

    // 2. Build the query to find matches (Price-Time Priority)
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .where('order.eventId = :eventId', { eventId: newOrder.event.id })
      .andWhere('order.type = :oppositeOrderType', { oppositeOrderType })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED],
      });

    if (isBuyOrder) {
      // New BUY order: Find SELL orders with price <= newOrder.price
      // Sort by price ASC (lowest seller first), then time ASC
      queryBuilder
        .andWhere('order.price <= :price', { price: newOrder.price })
        .orderBy('order.price', 'ASC')
        .addOrderBy('order.createdAt', 'ASC');
    } else {
      // New SELL order: Find BUY orders with price >= newOrder.price
      // Sort by price DESC (highest buyer first), then time ASC
      queryBuilder
        .andWhere('order.price >= :price', { price: newOrder.price })
        .orderBy('order.price', 'DESC')
        .addOrderBy('order.createdAt', 'ASC');
    }

    const counterOrders = await queryBuilder.getMany();

    // 3. Loop through potential matches
    for (const counterOrder of counterOrders) {
      if (newOrder.quantityRemaining === 0) {
        break; // The new order is fully filled
      }

      // Determine trade details
      const tradePrice = counterOrder.price; // Price is set by the resting order
      const matchQuantity = Math.min(
        newOrder.quantityRemaining,
        counterOrder.quantityRemaining,
      );

      // 4. Execute the trade in a transaction
      try {
        await this.executeTrade(
          isBuyOrder ? newOrder : counterOrder, // buyer's order
          isBuyOrder ? counterOrder : newOrder, // seller's order
          matchQuantity,
          tradePrice,
        );

        // 5. Update in-memory quantities for this loop
        newOrder.quantityRemaining -= matchQuantity;
        counterOrder.quantityRemaining -= matchQuantity;

        ordersToUpdate.push(counterOrder);
      } catch (err) {
        this.logger.error(`Trade execution failed: ${err}`);
        // If one trade fails, stop matching this order
        break;
      }
    }

    // 6. Update all matched orders in the database
    for (const order of ordersToUpdate) {
      if (order.quantityRemaining === 0) {
        order.status = OrderStatus.FILLED;
      } else if (order.quantityRemaining < order.quantity) {
        order.status = OrderStatus.PARTIALLY_FILLED;
      }
      // We don't need to 'await' this save, let it run
      void this.orderRepository.save(order);
    }

    // 7. Broadcast all updates
    void this.publishOrderBook(newOrder.event.id);
    this.logger.log(`Matching engine run complete for order ${newOrder.id}`);
  }

  //    This is the "Accountant."
  //    It executes a single trade inside a database transaction.

  private async executeTrade(
    buyerOrder: Order,
    sellerOrder: Order,
    quantity: number,
    price: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get all related entities
      const buyer = await queryRunner.manager.findOneOrFail(User, {
        where: { id: buyerOrder.user.id },
      });
      const seller = await queryRunner.manager.findOneOrFail(User, {
        where: { id: sellerOrder.user.id },
      });
      const event = await queryRunner.manager.findOneOrFail(Event, {
        where: { id: buyerOrder.event.id },
      });

      // Create the Trade receipt
      const newTrade = this.tradeRepository.create({
        event,
        buyer,
        seller,
        quantity,
        price,
      });
      await queryRunner.manager.save(newTrade);
      // We will publish this trade later

      // Update Buyer's Portfolio
      const buyerCost = price * quantity;
      const buyerHolding = await this.findOrCreateHolding(
        queryRunner.manager,
        buyer,
        event,
      );
      buyerHolding.quantity += quantity;
      // Refund the original lock from placeOrder, then subtract the actual cost
      buyer.virtualBalance += buyerOrder.price * quantity;
      buyer.virtualBalance -= buyerCost;
      await queryRunner.manager.save(buyer);
      await queryRunner.manager.save(buyerHolding);

      // Update Seller's Portfolio
      const sellerCollateral = (100 - price) * quantity;
      const sellerHolding = await this.findOrCreateHolding(
        queryRunner.manager,
        seller,
        event,
      );
      sellerHolding.quantity -= quantity;
      // Refund original collateral lock, lock new collateral, add cash
      seller.virtualBalance += (100 - sellerOrder.price) * quantity;
      seller.virtualBalance -= sellerCollateral;
      seller.virtualBalance += buyerCost; // Receive cash from buyer
      await queryRunner.manager.save(seller);
      await queryRunner.manager.save(sellerHolding);

      // Commit all changes at once
      await queryRunner.commitTransaction();

      // Publish the trade update *after* transaction is successful
      this.marketEvents.publishTradeUpdate(event.id, newTrade);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Transaction failed during executeTrade', err);
      throw new Error(`Trade execution failed: ${err}`);
    } finally {
      await queryRunner.release();
    }
  }

  //
  //    ====================================================================
  //    HELPER FUNCTIONS
  //    ====================================================================
  //

  //
  //     Finds a user's holding for an event, or creates a new one
  //     with quantity 0. This MUST be called inside a transaction.
  //
  private async findOrCreateHolding(
    manager: EntityManager, // This is the queryRunner.manager
    user: User,
    event: Event,
  ): Promise<Holding> {
    let holding = await manager.findOne(Holding, {
      where: { user: { id: user.id }, event: { id: event.id } },
    });
    if (!holding) {
      holding = manager.create(Holding, {
        user,
        event,
        quantity: 0,
      });
    }
    return holding;
  }

  //    Fetches and builds the aggregated order book for an event.

  private async getOrderBook(eventId: number) {
    const orders = await this.orderRepository.find({
      where: {
        event: { id: eventId },
        status: In([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED]),
      },
      order: {
        price: 'DESC', // Order by price first
      },
    });

    const buyMap = new Map<number, number>();
    const sellMap = new Map<number, number>();

    for (const order of orders) {
      if (order.type === OrderType.BUY) {
        const total = (buyMap.get(order.price) || 0) + order.quantityRemaining;
        buyMap.set(order.price, total);
      } else {
        const total = (sellMap.get(order.price) || 0) + order.quantityRemaining;
        sellMap.set(order.price, total);
      }
    }

    // Convert maps to sorted arrays
    const buy = Array.from(buyMap.entries())
      .map(([price, quantity]) => ({ price, quantity }))
      .sort((a, b) => b.price - a.price); // Highest buy price first

    const sell = Array.from(sellMap.entries())
      .map(([price, quantity]) => ({ price, quantity }))
      .sort((a, b) => a.price - b.price); // Lowest sell price first

    return { buy, sell };
  }

  //    Publishes the latest order book to the event service.

  private async publishOrderBook(eventId: number) {
    const orderBook = await this.getOrderBook(eventId);
    this.marketEvents.publishOrderBookUpdate(eventId, orderBook);
  }

  async placeOrder(user: User, placeOrderDto: PlaceOrderDto): Promise<Order> {
    const { eventId, type, quantity, price } = placeOrderDto;

    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new BadRequestException('Event not found');
    }
    if (event.status !== EventStatus.OPEN) {
      throw new BadRequestException('Event is not open for trading');
    }

    // calculating cost or collateral
    let cost = 0;
    let collateral = 0;
    if (type === OrderType.BUY) {
      cost = quantity * price;
    } else if (type === OrderType.SELL) {
      collateral = (100 - price) * quantity;
    } else {
      throw new BadRequestException('Invalid order type');
    }

    // check user's balance
    // we must re-fetch the user to get the most up to date balance
    const freshUser = await this.userRepository.findOne({
      where: { id: user.id },
    });
    if (!freshUser) {
      throw new BadRequestException('User not found');
    }

    if (type === OrderType.BUY && freshUser.virtualBalance < cost) {
      throw new BadRequestException('Insufficient balance to place buy order');
    }
    if (type === OrderType.SELL && freshUser.virtualBalance < collateral) {
      throw new BadRequestException('Insufficient balance to place sell order');
    }

    // ----lock funds and save order-------
    // we must use a database transaction here to prevent race conditions.
    // this make sure that we save the order and update the user's balance atomically at the same time.

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedOrder: Order | null = null;

    try {
      if (type === OrderType.BUY) {
        freshUser.virtualBalance -= cost;
      } else if (type === OrderType.SELL) {
        freshUser.virtualBalance -= collateral;
      }
      await queryRunner.manager.save(freshUser);

      const newOrder = queryRunner.manager.create(Order, {
        user: freshUser,
        event,
        type,
        price,
        quantity,
        quantityRemaining: quantity,
        status: OrderStatus.OPEN,
      });

      savedOrder = await queryRunner.manager.save(newOrder);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`failed to place order: ${error}`);
    } finally {
      await queryRunner.release();
    }

    if (!savedOrder) {
      throw new BadRequestException('Failed to place order');
    }

    this.logger.log(
      `Order placed: ${savedOrder.id} by User: ${user.id}, Triggering matching engine`,
    );

    this.runMatchingEngine(savedOrder).catch((err) => {
      this.logger.error(
        `Matching engine error for order ${savedOrder.id}: ${err}`,
      );
    });

    return savedOrder;
  }
}
