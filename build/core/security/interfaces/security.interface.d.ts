import { User } from "src/modules/users/entities/user.entity";
export interface RateLimitResult {
    totalHits: number;
    resetTime: Date;
    remaining: number;
    isBlocked: boolean;
    retryAfter?: number;
}
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    blockDurationMs?: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}
export interface RateLimitMetrics {
    totalKeys: number;
    memory: string;
    connections: number;
    commandsProcessed: number;
}
export interface RateLimitHealth {
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
}
export type AuthUserType = 'user' | 'admin';
export interface AuthResult {
    success: boolean;
    user?: User;
    userType?: AuthUserType;
}
