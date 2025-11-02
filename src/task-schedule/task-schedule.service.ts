import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Event, EventStatus } from 'src/market-event/entities/event.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TaskScheduleService {
  private readonly logger = new Logger(TaskScheduleService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  // runs every minute ( at the 0 second mark)
  // it finds all 'SCHEDULED' events that are ready to go 'OPEN' and updates their status
  @Cron(CronExpression.EVERY_MINUTE)
  async openMarket() {
    this.logger.log('Checking for events to open');
    const now = new Date();

    // find events that are 'SCHEDULED' and whose start date is in the part
    const eventsToOpen = await this.eventRepository.find({
      where: {
        status: EventStatus.SCHEDULED,
        tradingStartDate: LessThan(now), // find dates older then "now"
      },
    });
    if (eventsToOpen.length === 0) {
      return;
    }

    this.logger.log(`Found ${eventsToOpen.length} events to open`);

    // set all found events to 'OPEN'
    for (const event of eventsToOpen) {
      event.status = EventStatus.OPEN;
      await this.eventRepository.save(event);
      this.logger.log(`Event ID ${event.id} is now OPEN`);
    }
  }

  // This runs every minute (at the 30 second mark) to avoid overlap with the openMarket cron
  // it finds all 'OPEN' events that are ready to go 'CLOSED' and updates their status
  @Cron(CronExpression.EVERY_30_SECONDS)
  async closeMarket() {
    this.logger.log('Checking for events to close');
    const now = new Date();

    // find events that are 'OPEN' and whose resolution date is in the past
    const eventsToClose = await this.eventRepository.find({
      where: {
        status: EventStatus.OPEN,
        resolutionDate: LessThan(now), // find dates older then "now"
      },
    });
    if (eventsToClose.length === 0) {
      return;
    }

    this.logger.log(`Found ${eventsToClose.length} events to close`);

    // set all found events to 'CLOSED'
    for (const event of eventsToClose) {
      event.status = EventStatus.CLOSED;
      await this.eventRepository.save(event);
      this.logger.log(`Event ID ${event.id} is now CLOSED`);
    }
  }
}
