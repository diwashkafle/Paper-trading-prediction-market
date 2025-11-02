import { Order } from 'src/live-market/entities/order.entity';
import { Holding } from 'src/portfolio/entities/holding.entity';
import { Trade } from 'src/live-market/entities/trades.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum EventStatus {
  SCHEDULED = 'scheduled',
  OPEN = 'open',
  CLOSED = 'closed',
  RESOLVED = 'resolved',
  CANCELED = 'canceled',
}

export enum EventOutcome {
  PENDING = 'PENDING',
  YES = 'YES',
  NO = 'NO',
}

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.SCHEDULED,
  })
  status: EventStatus;

  @Column({
    type: 'timestamp',
    comment: 'When trading begins',
  })
  tradingStartDate: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When the event is resolved',
  })
  resolutionDate: Date | null;

  @Column({
    type: 'enum',
    enum: EventOutcome,
    default: EventOutcome.PENDING,
  })
  outcome: EventOutcome;

  @OneToMany(() => Holding, (holding) => holding.event)
  holdings: Holding[];

  @OneToMany(() => Trade, (trade) => trade.event)
  trades: Trade[];

  @OneToMany(() => Order, (order) => order.event)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
