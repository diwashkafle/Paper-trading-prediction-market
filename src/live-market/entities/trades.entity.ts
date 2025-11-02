// src/market/entities/trade.entity.ts

import { Order } from 'src/live-market/entities/order.entity';
import { Event } from 'src/market-event/entities/event.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
// We will create the 'Order' entity soon
// import { Order } from './order.entity';

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
    comment: 'Quantity of contracts exchanged',
  })
  quantity: number;

  @Column({
    type: 'int',
    comment: 'Price the trade was executed at (1-99)',
  })
  price: number;

  // --- Relations ---

  @ManyToOne(() => Event, (event) => event.trades)
  event: Event;

  @ManyToOne(() => User, (user) => user.buyTrades)
  buyer: User; // The user who bought 'YES'

  @ManyToOne(() => User, (user) => user.sellTrades)
  seller: User; // The user who sold 'YES'

  // These link the trade back to the specific orders
  @ManyToOne(() => Order)
  buyOrder: Order;

  @ManyToOne(() => Order)
  sellOrder: Order;

  @CreateDateColumn()
  createdAt: Date;
}
