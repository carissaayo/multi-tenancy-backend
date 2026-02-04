import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

import { RateLimitConfig } from '../interfaces/security.interface';
import { RedisRateLimiter } from './radis-rate-limiter.service';

interface RequestWithWorkspace extends Request {
  workspace?: {
    id: string;
    slug: string;
    plan: string;
  };
  workspaceId?: string;
  user?: {
    id: string;
    _id?: string;
  };
}

@Injectable()
export class RateLimitHandler {
  private readonly logger = new Logger(RateLimitHandler.name);

  constructor(private readonly redisRateLimiter: RedisRateLimiter) {}

  async checkRateLimit(
    req: RequestWithWorkspace,
    res: Response,
  ): Promise<boolean> {
    const identifier = this.getRateLimitIdentifier(req);
    const config = this.getRateLimitConfig(req);

    this.logger.debug(`Rate limit check - Identifier: ${identifier}`);

    const result = await this.redisRateLimiter.checkRateLimit(
      identifier,
      config,
      1,
    );

    res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, result.remaining).toString(),
    );
    res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

    if (result.isBlocked) {
      if (result.retryAfter) {
        res.setHeader('Retry-After', result.retryAfter.toString());
      }

      this.logger.warn(`Rate limit exceeded for identifier: ${identifier}`);

      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter,
        timestamp: new Date().toISOString(),
      });
      return false;
    }

    return true;
  }

  private getRateLimitIdentifier(req: RequestWithWorkspace): string {
    const ip = this.getClientIP(req);
    const userId = req.user?.id || req.user?._id || 'anonymous';
    const endpoint = req.route?.path || req.path;

    if (this.isGlobalRoute(req.path)) {
      return `global:${ip}:${userId}:${endpoint}`;
    }

    const workspaceId = req.workspaceId || req.workspace?.id || 'unknown';
    return `workspace:${workspaceId}:${ip}:${userId}:${endpoint}`;
  }

  private getRateLimitConfig(req: RequestWithWorkspace): RateLimitConfig {
    const path = req.path;
    const method = req.method;
    const plan = req.workspace?.plan || 'free';

    if (path.includes('/auth/login')) {
      return {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        blockDurationMs: 60 * 60 * 1000, // 1 hour block
      };
    }

    if (path.includes('/auth/register')) {
      return {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3,
        blockDurationMs: 24 * 60 * 60 * 1000, // 24 hour block
      };
    }

    if (path.includes('/auth/')) {
      return {
        windowMs: 5 * 60 * 1000, // 5 minutes
        maxRequests: 10,
        blockDurationMs: 30 * 60 * 1000, // 30 minutes block
      };
    }

    return this.getWorkspaceRateLimitByPlan(plan, method);
  }

  private getWorkspaceRateLimitByPlan(
    plan: string,
    method: string,
  ): RateLimitConfig {
    const planLimits = {
      free: {
        GET: { windowMs: 60 * 1000, maxRequests: 200 },
        POST: { windowMs: 60 * 1000, maxRequests: 60 },
        PUT: { windowMs: 60 * 1000, maxRequests: 60 },
        PATCH: { windowMs: 60 * 1000, maxRequests: 60 },
        DELETE: { windowMs: 60 * 1000, maxRequests: 30 },
      },
      pro: {
        GET: { windowMs: 60 * 1000, maxRequests: 800 },
        POST: { windowMs: 60 * 1000, maxRequests: 200 },
        PUT: { windowMs: 60 * 1000, maxRequests: 200 },
        PATCH: { windowMs: 60 * 1000, maxRequests: 200 },
        DELETE: { windowMs: 60 * 1000, maxRequests: 100 },
      },
      enterprise: {
        GET: { windowMs: 60 * 1000, maxRequests: 2000 },
        POST: { windowMs: 60 * 1000, maxRequests: 500 },
        PUT: { windowMs: 60 * 1000, maxRequests: 500 },
        PATCH: { windowMs: 60 * 1000, maxRequests: 500 },
        DELETE: { windowMs: 60 * 1000, maxRequests: 250 },
      },
    };

    const limits = planLimits[plan] || planLimits.free;
    const methodLimit = limits[method] || limits.GET;

    return {
      ...methodLimit,
      blockDurationMs: 5 * 60 * 1000,
    };
  }

  private isGlobalRoute(path: string): boolean {
    const globalRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/health',
      '/api/metrics',
      '/auth/login',
      '/auth/register',
      '/health',
      '/metrics',
    ];

    return globalRoutes.some((route) => path.startsWith(route));
  }

  private getClientIP(req: Request): string {
    const xfwd = (req.headers['x-forwarded-for'] as string | undefined)
      ?.split(',')[0]
      ?.trim();
    const xreal = (req.headers['x-real-ip'] as string | undefined)?.trim();
    const conn = (req as any).connection?.remoteAddress as string | undefined;
    const sock = (req.socket as any)?.remoteAddress as string | undefined;
    return xfwd || xreal || conn || sock || '127.0.0.1';
  }
}
