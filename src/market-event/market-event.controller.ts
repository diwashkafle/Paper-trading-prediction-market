import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MarketEventService } from './market-event.service';

@Controller('market-events')
export class MarketEventController {
  constructor(private readonly eventService: MarketEventService) {}

  @Get()
  async getAllActiveEvents() {
    return await this.eventService.getAllEventsPublic();
  }

  @Get(':id')
  async getEventById(@Param('id', ParseIntPipe) id: number) {
    return await this.eventService.getEventById(id);
  }
}
