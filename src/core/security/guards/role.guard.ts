
import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  CanActivate,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/app/user/user.interface';

import { customError } from 'src/libs/custom-handlers';


// 🎯 SIMPLE DECORATOR - Require user to have ONE of these roles
export const RequireRoles = (...roles: string[]) => SetMetadata('roles', roles);

// Get current user decorator (same as your permission guard)
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw customError.unauthorized('Authentication required');
    }

    const userRole: UserRole = user.role;

    if (!userRole) {
      throw customError.badRequest('User has no role assigned');
    }

    // ✅ Check if user's role is in allowed roles
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw customError.forbidden('Role Denied');
    }

    this.logger.debug(`✅ Role check passed for role: ${userRole}`);
    return true;
  }
}
