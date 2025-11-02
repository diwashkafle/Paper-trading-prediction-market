import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event, EventOutcome } from 'src/market-event/entities/event.entity';
import { Holding } from 'src/portfolio/entities/holding.entity';
import { User } from 'src/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    @InjectRepository(Holding)
    private readonly holdingRepository: Repository<Holding>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  //   this is the main function that settles a market, it is called by the EventAdminController when an event is resolved

  async executePayouts(event: Event): Promise<void> {
    this.logger.log(`Starting payouts for event ID: ${event.id}`);

    // safely check: ensure the event is actually resolved
    if (event.outcome === EventOutcome.PENDING) {
      throw new BadRequestException(
        'Cannot execute payouts for a pending event.',
      );
    }

    // find all the holdings for this event.

    const holdings = await this.holdingRepository.find({
      where: { event: { id: event.id } },
      relations: ['user'],
    });

    if (holdings.length === 0) {
      this.logger.log(
        `No holdings found for event ID: ${event.id}. No payouts to process.`,
      );
    }

    // start a database transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // loop through each holding and calculate payouts
      for (const holding of holdings) {
        let payout = 0;

        if (event.outcome === EventOutcome.YES) {
          if (holding.quantity > 0) {
            payout = holding.quantity * 100;
          }
        } else {
          // 'NO' as outcome, pay those who held 'NO' positions
          if (holding.quantity < 0) {
            // negative quantity indicates 'NO' position, if quantity > 0 it's a 'YES' position, so no payout
            payout = Math.abs(holding.quantity) * 100;
          }
        }
        if (payout > 0) {
          // use the queryRunner's manager to update the user's balance within the transaction
          // to entire it's part of the transaction
          await queryRunner.manager.increment(
            User,
            { id: holding.user.id },
            'virtualBalance',
            payout,
          );
        }

        holding.quantity = 0; // reset holding quantity to zero after payout
        await queryRunner.manager.save(holding);
      }

      // if all loops succeed, commit the transaction
      await queryRunner.commitTransaction();
      this.logger.log(
        `Payouts successfully executed for event ID: ${event.id}`,
      );
    } catch (error) {
      // if any payout fails, roll back everything
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error executing payouts for event ID: ${event.id}: ${error}`,
      );
      throw new Error('payout failed: ' + error);
    } finally {
      // release the query runner
      await queryRunner.release();
    }
  }
}
