import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { customError } from 'src/core/error-handler/custom-errors';

export const RateLimit = (limit: number, windowMs: number) =>
  SetMetadata('rate-limit', { limit, windowMs });

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private requests = new Map<string, number[]>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitConfig = this.reflector.get<{
      limit: number;
      windowMs: number;
    }>('rate-limit', context.getHandler());

    if (!rateLimitConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const workspace = request.workspace;
    const key = `${workspace?.id || 'global'}-${request.user?.id || 'anonymous'}`;

    const now = Date.now();
    const windowStart = now - rateLimitConfig.windowMs;

    // Get existing requests and filter out old ones
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter((time) => time > windowStart);

    if (recentRequests.length >= rateLimitConfig.limit) {
      this.logger.warn(`Rate limit exceeded for key: ${key}`);
      throw customError.custom(
        'Rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }
}
