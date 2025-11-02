import { Module } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { User } from 'src/user/entities/user.entity';
import { Holding } from 'src/portfolio/entities/holding.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  imports: [TypeOrmModule.forFeature([Holding, User])],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
