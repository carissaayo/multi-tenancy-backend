import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { customError } from 'src/core/error-handler/custom-errors';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_UNVERIFIED_KEY } from '../decorators/allow-unverified.decorator';

@Injectable()
export class EmailVerificationGuard implements CanActivate {
  private readonly logger = new Logger(EmailVerificationGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {    // Check if route is public - if so, skip email verification check
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get user from request (set by authentication middleware)
    const request = context.switchToHttp().getRequest();
    const user = request.user;


    if (!user) {
      this.logger.debug(
        'No user found - authentication middleware will handle authentication',
      );
      return true;
    }

    // Check if route allows unverified users
    const allowUnverified = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNVERIFIED_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If route allows unverified users, skip email verification check
    if (allowUnverified) {
      this.logger.debug(
        `Route allows unverified users, skipping email verification for user ${user.id}`,
      );
      return true;
    }

    // For routes that require email verification, check if email is verified
    if (!user.isEmailVerified) {
      this.logger.warn(
        `Email verification required: User ${user.id} attempted to access protected route without verified email`,
      );
      throw customError.forbidden(
        'Please verify your email address to access this resource. Check your inbox for the verification link.',
      );
    }

    this.logger.debug(`✅ Email verification check passed for user ${user.id}`);
    return true;
  }
}
