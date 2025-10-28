import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// this guard protects routes using JWT strategy that requires authentication -> Protected routes
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
