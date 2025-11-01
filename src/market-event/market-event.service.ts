import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Event, EventOutcome, EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ResolveEventDto } from './dto/resolve-event.dto';

@Injectable()
export class MarketEventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}
  async getAllEventsPublic(): Promise<Event[]> {
    return this.eventRepository.find({
      where: {
        status: In([EventStatus.SCHEDULED, EventStatus.OPEN]),
      },
      order: {
        tradingStartDate: 'ASC',
      },
    });
  }

  async getAllEventsAdmin(): Promise<Event[]> {
    return this.eventRepository.find({
      order: {
        tradingStartDate: 'ASC',
      },
    });
  }

  async getEventById(id: number): Promise<Event | null> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    return event;
  }

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const newEvent = this.eventRepository.create(createEventDto);
    return this.eventRepository.save(newEvent);
  }

  // update event

  async updateEvent(
    id: number,
    updateEventDto: UpdateEventDto,
  ): Promise<Event | null> {
    const event = await this.getEventById(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    if (
      event?.status === EventStatus.RESOLVED ||
      event?.status === EventStatus.CANCELED
    ) {
      throw new BadRequestException(
        'Cannot update a resolved or canceled event',
      );
    }
    // it merges the existing event with the updated fields, it is cleanest way to apply partial updates
    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }
  async resolveEvent(
    id: number,
    resolveEventDto: ResolveEventDto,
  ): Promise<Event | null> {
    const event = await this.getEventById(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    if (event.status !== EventStatus.CLOSED) {
      throw new BadRequestException('Only closed events can be resolved');
    }

    if (event.outcome !== EventOutcome.PENDING) {
      throw new BadRequestException('Event has already been resolved');
    }

    event.status = EventStatus.RESOLVED;
    event.outcome = resolveEventDto.outcome;

    // this is where the payOutService will trigger payouts to users based on outcome, which is yet to build

    return this.eventRepository.save(event);
  }

  async cancelEvent(id: number): Promise<Event | null> {
    const event = await this.getEventById(id);
    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }
    if (event.status === EventStatus.RESOLVED) {
      throw new BadRequestException('Cannot cancel a resolved event');
    }
    if (event.status === EventStatus.CANCELED) {
      throw new BadRequestException('Event is already canceled');
    }

    event.status = EventStatus.CANCELED;
    // this is where the refundService will trigger refunds to users, which is yet to build
    return this.eventRepository.save(event);
  }
}
