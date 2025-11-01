import { IsDateString, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateEventDto {
  @IsString({ message: 'Event title  must be a string' })
  @IsNotEmpty({ message: 'Event title  is required' })
  @MinLength(5, { message: 'Event title  must be at least 5 characters long' })
  title: string;

  @IsString({ message: 'Event description  must be a string' })
  @IsNotEmpty({ message: 'Event description  is required' })
  @MinLength(10, {
    message: 'Event description  must be at least 10 characters long',
  })
  description: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Trading start date is required' })
  tradingStartDate: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Resolution date is required' })
  resolutionDate: string;
}
