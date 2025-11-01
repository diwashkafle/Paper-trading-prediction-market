import { Module } from '@nestjs/common';
import { MarketEventController } from './market-event.controller';
import { MarketEventService } from './market-event.service';
import { Event } from './entities/event.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketEventAdminController } from './market-event.admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  controllers: [MarketEventController, MarketEventAdminController],
  providers: [MarketEventService],
  exports: [MarketEventService],
})
export class MarketEventModule {}
