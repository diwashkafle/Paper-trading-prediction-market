import { Module } from '@nestjs/common';
import { LiveMarketController } from './live-market.controller';
import { LiveMarketService } from './live-market.service';

@Module({
  controllers: [LiveMarketController],
  providers: [LiveMarketService]
})
export class LiveMarketModule {}
