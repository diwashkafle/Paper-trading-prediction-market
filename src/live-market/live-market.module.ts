import { Module } from '@nestjs/common';
import { LiveMarketController } from './live-market.controller';
import { LiveMarketService } from './live-market.service';
import { Order } from './entities/order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from './entities/trades.entity';
import { Holding } from 'src/portfolio/entities/holding.entity';
import { User } from 'src/user/entities/user.entity';
import { Event } from 'src/market-event/entities/event.entity';
import { MarketGateway } from './market.gateway';
import { MarketEventsService } from './market-events.service';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Trade, Holding, User, Event]),
    UserModule,
    JwtModule,
  ],
  controllers: [LiveMarketController],
  providers: [LiveMarketService, MarketGateway, MarketEventsService],
  exports: [TypeOrmModule, MarketEventsService],
})
export class LiveMarketModule {}
