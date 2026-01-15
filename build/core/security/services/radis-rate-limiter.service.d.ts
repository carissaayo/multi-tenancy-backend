import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimitResult, RateLimitConfig } from '../interfaces/security.interface';
export declare class RedisRateLimiter implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private redis;
    private readonly keyPrefix;
    private readonly blockPrefix;
    private readonly rateLimitScript;
    private readonly cleanupScript;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private initializeRedis;
    private getRedisConfig;
    checkRateLimit(identifier: string, config: RateLimitConfig, increment?: number): Promise<RateLimitResult>;
    resetRateLimit(identifier: string): Promise<void>;
    getRateLimitInfo(identifier: string): Promise<{
        count: number;
        resetTime: Date;
        isBlocked: boolean;
        blockedUntil?: Date;
    } | null>;
    getTopConsumers(limit?: number): Promise<Array<{
        identifier: string;
        count: number;
        resetTime: Date;
    }>>;
    getTotalActiveKeys(): Promise<number>;
    cleanupExpiredKeys(): Promise<number>;
    private getRateLimitKey;
    private getBlockKey;
    private startPeriodicCleanup;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        latency?: number;
        error?: string;
    }>;
    getMetrics(): Promise<{
        totalKeys: number;
        memory: string;
        connections: number;
        commandsProcessed: number;
    }>;
}
