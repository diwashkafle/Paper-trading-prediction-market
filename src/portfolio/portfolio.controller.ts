import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PortfolioService } from './portfolio.service';
import { User } from 'src/user/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('holdings')
  getHoldings(@CurrentUser() user: User) {
    return this.portfolioService.getHoldings(user.id);
  }

  @Get('trade-history')
  getTradeHistory(@CurrentUser() user: User) {
    return this.portfolioService.getTradeHistory(user.id);
  }
}
