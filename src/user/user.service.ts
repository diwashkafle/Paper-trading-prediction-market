import { ConflictException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password } = createUserDto;

    const existingUser = await this.userRepository.findOneBy([
      { username },
      { email },
    ]);

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await hash(password, 10);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    await this.userRepository.save(newUser);
    return newUser;
  }

  async getUserProfile(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async updateUserProfile(
    id: number,
    updateData: Partial<User>,
  ): Promise<User | null> {
    await this.userRepository.update(id, updateData);
    return this.getUserProfile(id);
  }

  async changePassword(id: number, newPassword: string): Promise<boolean> {
    const result = await this.userRepository.update(id, {
      password: newPassword,
    });
    return (result.affected ?? 0) > 0;
  }
}
