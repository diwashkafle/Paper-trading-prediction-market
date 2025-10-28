/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { compare, hash } from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return compare(password, hashedPassword);
  }

  async createUser(createUserDto: CreateUserDto): Promise<Partial<User>> {
    const existingUser = await this.userRepository.findOneBy([
      { username: createUserDto.username },
      { email: createUserDto.email },
    ]);

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await hash(createUserDto.password, 10);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    await this.userRepository.save(newUser);

    const { password, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy([{ email }]);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy([{ id }]);
  }

  async getUserProfile(email: string): Promise<Partial<User>> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<User>> {
    //  Check if user exists
    const user = await this.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    //  Check if username is being updated and if it's already taken
    if (updateUserDto.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Username already exists');
      }
    }

    //  Update the user
    await this.userRepository.update(id, updateUserDto);

    //  Return updated user without password
    const updatedUser = await this.getUserById(id);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async changePassword(
    id: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.getUserById(id);
    console.log(user?.password, changePasswordDto.oldPassword);
    if (
      !user ||
      !(await this.verifyPassword(changePasswordDto.oldPassword, user.password))
    ) {
      throw new NotFoundException('User not found or invalid current password');
    }

    const newHashedPassword = await hash(changePasswordDto.newPassword, 10);
    const updateResult = await this.userRepository.update(id, {
      password: newHashedPassword,
    });

    if (updateResult.affected === 0) {
      throw new NotFoundException('User not found');
    }
    return { message: 'Password changed successfully' };
  }
}
