import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(12, { message: 'Password must be at most 12 characters long' })
  newPassword: string;

  @IsNotEmpty({ message: 'Old password is required' })
  @MinLength(8, { message: 'Old password must be at least 8 characters long' })
  @MaxLength(12, { message: 'Password must be at most 12 characters long' })
  oldPassword: string;
}
