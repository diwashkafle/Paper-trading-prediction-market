import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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
    type: 'enum',
    enum: EventOutcome,
    default: EventOutcome.PENDING,
  })
  outcome: EventOutcome;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
