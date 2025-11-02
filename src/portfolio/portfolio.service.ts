import { Injectable } from '@nestjs/common';
import { Holding } from './entities/holding.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/live-market/entities/order.entity';
import { Trade } from 'src/live-market/entities/trades.entity';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Holding)
    private readonly holdingRepository: Repository<Holding>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async getHoldings(userId: number) {
    return this.holdingRepository.find({
      where: {
        user: { id: userId },
      },
      relations: ['event'],
    });
  }

  async getTradeHistory(userId: number): Promise<any> {
    return this.tradeRepository.find({
      where: [{ buyer: { id: userId } }, { seller: { id: userId } }],
      relations: ['event'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
