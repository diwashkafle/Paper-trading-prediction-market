import { Order } from 'src/live-market/entities/order.entity';
import { Holding } from 'src/portfolio/entities/holding.entity';
import { Trade } from 'src/live-market/entities/trades.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10000 })
  virtualBalance: number;

  @OneToMany(() => Holding, (holding) => holding.user)
  holdings: Holding[];

  @OneToMany(() => Trade, (trade) => trade.buyer)
  buyTrades: Trade[];

  @OneToMany(() => Trade, (trade) => trade.seller)
  sellTrades: Trade[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
