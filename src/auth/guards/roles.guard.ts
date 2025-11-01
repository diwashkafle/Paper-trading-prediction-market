import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/user/entities/user.entity';
import { ROLE_KEY } from '../decorators/roles.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  // Reflector is used to get the metadata set by the Roles decorator
  canActivate(context: ExecutionContext): boolean {
    // context: A big object that holds everything about the current request, including the controller (getClass()) and the route handler (getHandler()).
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLE_KEY,
      [
        context.getHandler(), // method level metadata
        context.getClass(), // class level metadata
      ],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    console.log('User role:', user.role);
    console.log('Required roles:', requiredRoles);
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
    return true;
  }
}
