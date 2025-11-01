import { Module } from '@nestjs/common';
import { MarketEventController } from './market-event.controller';
import { MarketEventService } from './market-event.service';

@Module({
  controllers: [MarketEventController],
  providers: [MarketEventService],
})
export class MarketEventModule {}
