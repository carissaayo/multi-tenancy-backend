import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { customError } from 'src/core/error-handler/custom-errors';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_INACTIVE_KEY } from '../decorators/allow-inactive-user.decorator';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  private readonly logger = new Logger(ActiveUserGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.debug(
        'No user found - authentication middleware will handle authentication',
      );
      return true;
    }

    // Check if route allows inactive users
    const allowInactive = this.reflector.getAllAndOverride<boolean>(
      ALLOW_INACTIVE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If route allows inactive users, skip active user check
    if (allowInactive) {
      this.logger.debug(
        `Route allows inactive users, skipping active user check for user ${user.id}`,
      );
      return true;
    }

    // For routes that require active users, check if user is active
    if (!user.isActive) {
      this.logger.warn(
        `Active user required: User ${user.id} attempted to access protected route with inactive account`,
      );
      throw customError.forbidden(
        'Your account is suspended, reach out to support for assistance',
      );
    }

    this.logger.debug(`✅ Active user check passed for user ${user.id}`);
    return true;
  }
}
