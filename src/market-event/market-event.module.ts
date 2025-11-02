import { Module } from '@nestjs/common';
import { MarketEventController } from './market-event.controller';
import { MarketEventService } from './market-event.service';
import { Event } from './entities/event.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketEventAdminController } from './market-event.admin.controller';
import { PayoutModule } from 'src/payout/payout.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), PayoutModule],
  controllers: [MarketEventController, MarketEventAdminController],
  providers: [MarketEventService],
  exports: [MarketEventService],
})
export class MarketEventModule {}
