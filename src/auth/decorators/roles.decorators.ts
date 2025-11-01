import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/user/entities/user.entity';

export const ROLE_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => {
  return SetMetadata(ROLE_KEY, roles);
};
