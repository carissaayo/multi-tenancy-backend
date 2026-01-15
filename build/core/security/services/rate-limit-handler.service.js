"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RateLimitHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitHandler = void 0;
const common_1 = require("@nestjs/common");
const radis_rate_limiter_service_1 = require("./radis-rate-limiter.service");
let RateLimitHandler = RateLimitHandler_1 = class RateLimitHandler {
    redisRateLimiter;
    logger = new common_1.Logger(RateLimitHandler_1.name);
    constructor(redisRateLimiter) {
        this.redisRateLimiter = redisRateLimiter;
    }
    async checkRateLimit(req, res) {
        const identifier = this.getRateLimitIdentifier(req);
        const config = this.getRateLimitConfig(req);
        this.logger.debug(`Rate limit check - Identifier: ${identifier}`);
        const result = await this.redisRateLimiter.checkRateLimit(identifier, config, 1);
        res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
        res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());
        if (result.isBlocked) {
            if (result.retryAfter) {
                res.setHeader('Retry-After', result.retryAfter.toString());
            }
            this.logger.warn(`Rate limit exceeded for identifier: ${identifier}`);
            res.status(common_1.HttpStatus.TOO_MANY_REQUESTS).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                retryAfter: result.retryAfter,
                timestamp: new Date().toISOString(),
            });
            return false;
        }
        return true;
    }
    getRateLimitIdentifier(req) {
        const ip = this.getClientIP(req);
        const userId = req.user?.id || req.user?._id || 'anonymous';
        const endpoint = req.route?.path || req.path;
        if (this.isGlobalRoute(req.path)) {
            return `global:${ip}:${userId}:${endpoint}`;
        }
        const workspaceId = req.workspaceId || req.workspace?.id || 'unknown';
        return `workspace:${workspaceId}:${ip}:${userId}:${endpoint}`;
    }
    getRateLimitConfig(req) {
        const path = req.path;
        const method = req.method;
        const plan = req.workspace?.plan || 'free';
        if (path.includes('/auth/login')) {
            return {
                windowMs: 15 * 60 * 1000,
                maxRequests: 5,
                blockDurationMs: 60 * 60 * 1000,
            };
        }
        if (path.includes('/auth/register')) {
            return {
                windowMs: 60 * 60 * 1000,
                maxRequests: 3,
                blockDurationMs: 24 * 60 * 60 * 1000,
            };
        }
        if (path.includes('/auth/')) {
            return {
                windowMs: 5 * 60 * 1000,
                maxRequests: 10,
                blockDurationMs: 30 * 60 * 1000,
            };
        }
        return this.getWorkspaceRateLimitByPlan(plan, method);
    }
    getWorkspaceRateLimitByPlan(plan, method) {
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
            blockDurationMs: 5 * 60 * 1000,
        };
    }
    isGlobalRoute(path) {
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
    getClientIP(req) {
        const xfwd = req.headers['x-forwarded-for']
            ?.split(',')[0]
            ?.trim();
        const xreal = req.headers['x-real-ip']?.trim();
        const conn = req.connection?.remoteAddress;
        const sock = req.socket?.remoteAddress;
        return xfwd || xreal || conn || sock || '127.0.0.1';
    }
};
exports.RateLimitHandler = RateLimitHandler;
exports.RateLimitHandler = RateLimitHandler = RateLimitHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [radis_rate_limiter_service_1.RedisRateLimiter])
], RateLimitHandler);
//# sourceMappingURL=rate-limit-handler.service.js.map