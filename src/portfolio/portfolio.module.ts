import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Holding } from './entities/holding.entity';
import { LiveMarketModule } from 'src/live-market/live-market.module';
@Module({
  imports: [TypeOrmModule.forFeature([Holding]), LiveMarketModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
