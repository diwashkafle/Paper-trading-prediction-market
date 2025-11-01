import { IsEnum, IsNotEmpty } from 'class-validator';
import { EventOutcome } from '../entities/event.entity';

export class ResolveEventDto {
  @IsEnum(EventOutcome)
  @IsNotEmpty()
  outcome: EventOutcome;
}
