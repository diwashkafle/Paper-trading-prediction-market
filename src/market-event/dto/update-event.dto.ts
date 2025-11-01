import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateEventDto {
  @IsString({ message: 'Event title  must be a string' })
  @IsNotEmpty({ message: 'Event title  is required' })
  @IsOptional()
  @MinLength(5, { message: 'Event title  must be at least 5 characters long' })
  title?: string;

  @IsString({ message: 'Event description  must be a string' })
  @IsNotEmpty({ message: 'Event description  is required' })
  @MinLength(10, {
    message: 'Event description  must be at least 10 characters long',
  })
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Trading start date is required' })
  @IsOptional()
  tradingStartDate?: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Resolution date is required' })
  @IsOptional()
  resolutionDate?: string;
}
