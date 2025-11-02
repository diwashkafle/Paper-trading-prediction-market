import { Module } from '@nestjs/common';
import { TaskScheduleService } from './task-schedule.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from 'src/market-event/entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  providers: [TaskScheduleService],
})
export class TaskScheduleModule {}
