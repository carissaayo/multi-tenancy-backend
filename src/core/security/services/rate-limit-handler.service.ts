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

    // Set rate limit headers
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

  /**
   * 🔑 CRITICAL: Generate workspace-aware identifier
   */
  private getRateLimitIdentifier(req: RequestWithWorkspace): string {
    const ip = this.getClientIP(req);
    const userId = req.user?.id || req.user?._id || 'anonymous';
    const endpoint = req.route?.path || req.path;

    // Global routes (no workspace context needed)
    if (this.isGlobalRoute(req.path)) {
      return `global:${ip}:${userId}:${endpoint}`;
    }

    // Workspace routes (include workspace ID)
    const workspaceId = req.workspaceId || req.workspace?.id || 'unknown';
    return `workspace:${workspaceId}:${ip}:${userId}:${endpoint}`;
  }

  /**
   * 🎯 Get rate limit config based on workspace plan and route
   */
  private getRateLimitConfig(req: RequestWithWorkspace): RateLimitConfig {
    const path = req.path;
    const method = req.method;
    const plan = req.workspace?.plan || 'free';

    // Authentication routes - STRICT (global, no plan variation)
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

    // Workspace-specific routes - PLAN-BASED
    return this.getWorkspaceRateLimitByPlan(plan, method);
  }

  /**
   * 📊 Plan-based rate limits for workspace operations
   */
  private getWorkspaceRateLimitByPlan(
    plan: string,
    method: string,
  ): RateLimitConfig {
    const planLimits = {
      free: {
        POST: { windowMs: 60 * 1000, maxRequests: 20 },
        PUT: { windowMs: 60 * 1000, maxRequests: 20 },
        DELETE: { windowMs: 60 * 1000, maxRequests: 10 },
        PATCH: { windowMs: 60 * 1000, maxRequests: 20 },
        GET: { windowMs: 60 * 1000, maxRequests: 100 },
      },
      pro: {
        POST: { windowMs: 60 * 1000, maxRequests: 100 },
        PUT: { windowMs: 60 * 1000, maxRequests: 100 },
        DELETE: { windowMs: 60 * 1000, maxRequests: 50 },
        PATCH: { windowMs: 60 * 1000, maxRequests: 100 },
        GET: { windowMs: 60 * 1000, maxRequests: 500 },
      },
      enterprise: {
        POST: { windowMs: 60 * 1000, maxRequests: 1000 },
        PUT: { windowMs: 60 * 1000, maxRequests: 1000 },
        DELETE: { windowMs: 60 * 1000, maxRequests: 500 },
        PATCH: { windowMs: 60 * 1000, maxRequests: 1000 },
        GET: { windowMs: 60 * 1000, maxRequests: 5000 },
      },
    };

    const limits = planLimits[plan] || planLimits.free;
    const methodLimit = limits[method] || limits.GET;

    return {
      ...methodLimit,
      blockDurationMs: 5 * 60 * 1000, // 5 minutes block for all workspace operations
    };
  }

  private isGlobalRoute(path: string): boolean {
    const globalRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
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
