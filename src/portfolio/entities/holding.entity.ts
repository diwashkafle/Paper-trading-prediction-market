import { Event } from 'src/market-event/entities/event.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';

@Entity('holdings')
// This ensures a user can only have ONE row for each event
@Unique(['user', 'event'])
export class Holding {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  quantity: number; // e.g., 100 'YES' contracts

  @ManyToOne(() => User, (user) => user.holdings)
  user: User;

  @ManyToOne(() => Event, (event) => event.holdings)
  event: Event;
}
