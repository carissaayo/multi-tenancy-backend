// import { Injectable, HttpStatus } from '@nestjs/common';
// import type { Request, Response } from 'express';
// import { RedisRateLimiter } from './radis-rate-limiter.service';
// import { RateLimitConfig } from '../interfaces/security.interface';

// @Injectable()
// export class RateLimitHandler {
//   constructor(private readonly redisRateLimiter: RedisRateLimiter) {}

//   async checkRateLimit(req: Request, res: Response): Promise<boolean> {
//     const identifier = this.getRateLimitIdentifier(req);
//     const config = this.getRateLimitConfig(req.path, req.method);

//     const result = await this.redisRateLimiter.checkRateLimit(
//       identifier,
//       config,
//       1,
//     );

//     res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
//     res.setHeader(
//       'X-RateLimit-Remaining',
//       Math.max(0, result.remaining).toString(),
//     );
//     res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

//     if (result.isBlocked) {
//       if (result.retryAfter) {
//         res.setHeader('Retry-After', result.retryAfter.toString());
//       }

//       res.status(HttpStatus.TOO_MANY_REQUESTS).json({
//         success: false,
//         message: 'Too many requests. Please try again later.',
//         retryAfter: result.retryAfter,
//         timestamp: new Date().toISOString(),
//       });
//       return false;
//     }

//     return true;
//   }

//   private getRateLimitIdentifier(
//     req: Request & { route?: any; path: any; connection?: any; socket?: any },
//   ): string {
//     const ip = this.getClientIP(req);
//     const userId = (req as any).user?._id || 'anonymous';
//     const endpoint = req.route?.path || req.path;
//     return `${ip}:${userId}:${endpoint}`;
//   }

//   private getRateLimitConfig(path: string, method: string): RateLimitConfig {
//     // Authentication routes - very strict
//     if (path.includes('/auth/login')) {
//       return {
//         windowMs: 15 * 60 * 1000, // 15 minutes
//         maxRequests: 5,
//         blockDurationMs: 60 * 60 * 1000, // 1 hour block
//       };
//     }

//     if (path.includes('/auth/')) {
//       return {
//         windowMs: 5 * 60 * 1000, // 5 minutes
//         maxRequests: 10,
//         blockDurationMs: 30 * 60 * 1000, // 30 minutes block
//       };
//     }

//     // Admin routes
//     if (path.includes('/admin/')) {
//       return {
//         windowMs: 60 * 1000, // 1 minute
//         maxRequests: 20,
//         blockDurationMs: 10 * 60 * 1000, // 10 minutes block
//       };
//     }

//     // API routes based on method
//     switch (method) {
//       case 'POST':
//       case 'PUT':
//       case 'DELETE':
//       case 'PATCH':
//         return {
//           windowMs: 60 * 1000, // 1 minute
//           maxRequests: 30,
//           blockDurationMs: 5 * 60 * 1000, // 5 minutes block
//         };
//       case 'GET':
//         return {
//           windowMs: 60 * 1000, // 1 minute
//           maxRequests: 200,
//         };
//       default:
//         return {
//           windowMs: 60 * 1000, // 1 minute
//           maxRequests: 50,
//         };
//     }
//   }

//   private getClientIP(req: Request): string {
//     const xfwd = (req.headers['x-forwarded-for'] as string | undefined)
//       ?.split(',')[0]
//       ?.trim();
//     const xreal = (req.headers['x-real-ip'] as string | undefined)?.trim();
//     const conn = (req as any).connection?.remoteAddress as string | undefined;
//     const sock = (req.socket as any)?.remoteAddress as string | undefined;
//     return xfwd || xreal || conn || sock || '127.0.0.1';
//   }
// }
