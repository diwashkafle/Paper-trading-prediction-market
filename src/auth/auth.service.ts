/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dto/login-user.dto';
import { compare } from 'bcrypt';
import { User } from 'src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return compare(password, hashedPassword);
  }

  private generateAccessToken(user: User): string {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<number>('JWT_EXPIRES_IN');

    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
    };
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const expiresIn = this.configService.get<number>('JWT_REFRESH_EXPIRES_IN');

    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  private generateTokens(user: User) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  async register(createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.getUserProfile(loginDto.email);
    if (
      !user ||
      !(await this.verifyPassword(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException(
        'Invalid credentials or account does not exist',
      );
    }

    const tokens = this.generateTokens(user);
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<{ sub: number }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.userService.getUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
