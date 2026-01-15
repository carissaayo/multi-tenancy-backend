import type { Request, Response } from 'express';
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
export declare class RateLimitHandler {
    private readonly redisRateLimiter;
    private readonly logger;
    constructor(redisRateLimiter: RedisRateLimiter);
    checkRateLimit(req: RequestWithWorkspace, res: Response): Promise<boolean>;
    private getRateLimitIdentifier;
    private getRateLimitConfig;
    private getWorkspaceRateLimitByPlan;
    private isGlobalRoute;
    private getClientIP;
}
export {};
