import { Event } from 'src/market-event/entities/event.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';

// Defines the two types of orders
export enum OrderType {
  BUY = 'BUY', // An order to buy 'YES'
  SELL = 'SELL', // An order to sell 'YES'
}

// Defines the state of an order on the book
export enum OrderStatus {
  OPEN = 'OPEN', // Active on the book, no fills
  PARTIALLY_FILLED = 'PARTIALLY_FILLED', // Partially filled, still active
  FILLED = 'FILLED', // Completely filled, no longer active
  CANCELED = 'CANCELED', // Canceled by the user, no longer active
}

@Entity('orders')
// We add database indexes to make lookups much faster
@Index(['event', 'status']) // Speeds up finding all 'OPEN' orders for an event
@Index(['user', 'status']) // Speeds up finding a user's 'OPEN' orders
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: OrderType,
  })
  type: OrderType;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.OPEN,
  })
  status: OrderStatus;

  @Column({
    type: 'int',
    comment: 'The limit price for the order (1-99)',
  })
  price: number;

  @Column({
    type: 'int',
    comment: 'The original quantity the user placed',
  })
  quantity: number;

  @Column({
    type: 'int',
    comment: 'The quantity still left to be filled',
  })
  quantityRemaining: number;

  // This is the 'Time' in 'Price-Time Priority'
  @CreateDateColumn()
  createdAt: Date;

  // --- Relations ---

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @ManyToOne(() => Event, (event) => event.orders)
  event: Event;
}
