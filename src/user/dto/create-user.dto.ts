import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Username is required' })
  @IsString({ message: 'Username must be a string' })
  @MinLength(4, { message: 'Username must be at least 4 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  username: string;

  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(50, { message: 'Email must be at most 50 characters long' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 8 characters long' })
  @MaxLength(12, { message: 'Password must be at most 12 characters long' })
  password: string;
}
