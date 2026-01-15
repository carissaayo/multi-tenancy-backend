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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisRateLimiter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisRateLimiter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisRateLimiter = RedisRateLimiter_1 = class RedisRateLimiter {
    configService;
    logger = new common_1.Logger(RedisRateLimiter_1.name);
    redis;
    keyPrefix = 'rate_limit:';
    blockPrefix = 'rate_limit_block:';
    rateLimitScript = `
    local key = KEYS[1]
    local block_key = KEYS[2]
    local window = tonumber(ARGV[1])
    local limit = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local block_duration = tonumber(ARGV[4])
    local increment = tonumber(ARGV[5])

    -- Check if currently blocked
    local blocked_until = redis.call('GET', block_key)
    if blocked_until then
      blocked_until = tonumber(blocked_until)
      if now < blocked_until then
        local remaining_block = blocked_until - now
        return {0, blocked_until, 0, 1, remaining_block} -- {count, reset_time, remaining, blocked, retry_after}
      else
        redis.call('DEL', block_key)
      end
    end

    -- Get current count and expiry
    local current = redis.call('HMGET', key, 'count', 'reset_time')
    local count = tonumber(current[1]) or 0
    local reset_time = tonumber(current[2]) or 0

    -- Check if window has expired
    if now >= reset_time then
      count = 0
      reset_time = now + window
    end

    -- Increment if requested
    if increment > 0 then
      count = count + increment
    end

    -- Set the new values with expiration
    redis.call('HMSET', key, 'count', count, 'reset_time', reset_time)
    redis.call('EXPIRE', key, math.ceil(window / 1000))

    local remaining = math.max(0, limit - count)
    local is_blocked = 0
    local retry_after = 0

    -- Check if limit exceeded
    if count > limit then
      is_blocked = 1
      if block_duration > 0 then
        local block_until = now + block_duration
        redis.call('SETEX', block_key, math.ceil(block_duration / 1000), block_until)
        retry_after = block_duration
      else
        retry_after = reset_time - now
      end
    end

    return {count, reset_time, remaining, is_blocked, retry_after}
  `;
    cleanupScript = `
    local pattern = ARGV[1]
    local batch_size = tonumber(ARGV[2]) or 100
    local cursor = "0"
    local deleted = 0

    repeat
      local scan_result = redis.call('SCAN', cursor, 'MATCH', pattern, 'COUNT', batch_size)
      cursor = scan_result[1]
      local keys = scan_result[2]

      if #keys > 0 then
        deleted = deleted + redis.call('DEL', unpack(keys))
      end
    until cursor == "0"

    return deleted
  `;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        await this.initializeRedis();
        this.startPeriodicCleanup();
    }
    async onModuleDestroy() {
        if (this.redis) {
            await this.redis.disconnect?.();
        }
    }
    async initializeRedis() {
        const redisConfig = this.getRedisConfig();
        try {
            if (redisConfig.cluster && redisConfig.cluster.length > 0) {
                this.redis = new ioredis_1.default.Cluster(redisConfig.cluster, {
                    redisOptions: {
                        password: redisConfig.password,
                        db: redisConfig.db,
                        keyPrefix: this.keyPrefix,
                        maxRetriesPerRequest: 3,
                        lazyConnect: true,
                        keepAlive: 30000,
                        connectTimeout: 10000,
                        commandTimeout: 5000,
                    },
                    enableOfflineQueue: false,
                    retryDelayOnFailover: 100,
                    scaleReads: 'slave',
                });
            }
            else if (redisConfig.url) {
                this.redis = new ioredis_1.default(redisConfig.url, {
                    lazyConnect: true,
                    maxRetriesPerRequest: 3,
                    keepAlive: 30000,
                    connectTimeout: 10000,
                    commandTimeout: 5000,
                });
            }
            else {
                this.redis = new ioredis_1.default({
                    host: redisConfig.host,
                    port: redisConfig.port,
                    password: redisConfig.password,
                    db: redisConfig.db,
                    keyPrefix: this.keyPrefix,
                    lazyConnect: true,
                    maxRetriesPerRequest: 3,
                    keepAlive: 30000,
                    connectTimeout: 10000,
                    commandTimeout: 5000,
                });
            }
            this.redis.on('connect', () => this.logger.log('Connected to Redis'));
            this.redis.on('error', (error) => this.logger.error('Redis connection error:', error));
            this.redis.on('close', () => this.logger.warn('Redis connection closed'));
            this.redis.on('reconnecting', () => this.logger.log('Reconnecting to Redis...'));
            await this.redis.ping();
            this.logger.log('Redis rate limiter initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Redis:', error);
            throw error;
        }
    }
    getRedisConfig() {
        const clusterNodes = this.configService.get('REDIS_CLUSTER_NODES');
        return {
            url: this.configService.get('REDIS_URL'),
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: Number(this.configService.get('REDIS_PORT', 6379)),
            password: this.configService.get('REDIS_PASSWORD'),
            db: Number(this.configService.get('REDIS_DB', 0)),
            cluster: clusterNodes
                ? clusterNodes.split(',').map((node) => {
                    const [host, port] = node.split(':');
                    return { host, port: parseInt(port || '6379', 10) };
                })
                : undefined,
        };
    }
    async checkRateLimit(identifier, config, increment = 1) {
        try {
            const key = this.getRateLimitKey(identifier);
            const blockKey = this.getBlockKey(identifier);
            const now = Date.now();
            const result = (await this.redis.eval(this.rateLimitScript, 2, key, blockKey, config.windowMs.toString(), config.maxRequests.toString(), now.toString(), (config.blockDurationMs || 0).toString(), increment.toString()));
            const [count, resetTime, remaining, isBlocked, retryAfter] = result;
            return {
                totalHits: count,
                resetTime: new Date(resetTime),
                remaining: remaining,
                isBlocked: Boolean(isBlocked),
                retryAfter: retryAfter > 0 ? Math.ceil(retryAfter / 1000) : undefined,
            };
        }
        catch (error) {
            this.logger.error(`Rate limit check failed for ${identifier}:`, error);
            return {
                totalHits: 0,
                resetTime: new Date(Date.now() + config.windowMs),
                remaining: config.maxRequests,
                isBlocked: false,
            };
        }
    }
    async resetRateLimit(identifier) {
        try {
            const key = this.getRateLimitKey(identifier);
            const blockKey = this.getBlockKey(identifier);
            await Promise.all([
                this.redis.del(key),
                this.redis.del(blockKey),
            ]);
            this.logger.log(`Rate limit reset for ${identifier}`);
        }
        catch (error) {
            this.logger.error(`Failed to reset rate limit for ${identifier}:`, error);
        }
    }
    async getRateLimitInfo(identifier) {
        try {
            const key = this.getRateLimitKey(identifier);
            const blockKey = this.getBlockKey(identifier);
            const [rateLimitData, blockedUntil] = await Promise.all([
                this.redis.hmget(key, 'count', 'reset_time'),
                this.redis.get(blockKey),
            ]);
            if ((!rateLimitData || !rateLimitData[0]) && !blockedUntil) {
                return null;
            }
            return {
                count: parseInt(rateLimitData?.[0] || '0', 10),
                resetTime: new Date(parseInt(rateLimitData?.[1] || '0', 10)),
                isBlocked: Boolean(blockedUntil),
                blockedUntil: blockedUntil
                    ? new Date(parseInt(blockedUntil, 10))
                    : undefined,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get rate limit info for ${identifier}:`, error);
            return null;
        }
    }
    async getTopConsumers(limit = 10) {
        try {
            const keys = await this.redis.keys(`${this.keyPrefix}*`);
            const consumers = [];
            const batchSize = 50;
            for (let i = 0; i < keys.length; i += batchSize) {
                const batch = keys.slice(i, i + batchSize);
                const pipeline = this.redis.pipeline();
                batch.forEach((key) => {
                    pipeline.hmget(key, 'count', 'reset_time');
                });
                const results = await pipeline.exec();
                results?.forEach((result, index) => {
                    const data = result?.[1];
                    if (data) {
                        const [count, resetTime] = data;
                        consumers.push({
                            identifier: batch[index].replace(this.keyPrefix, ''),
                            count: parseInt(count || '0', 10),
                            resetTime: new Date(parseInt(resetTime || '0', 10)),
                        });
                    }
                });
            }
            return consumers.sort((a, b) => b.count - a.count).slice(0, limit);
        }
        catch (error) {
            this.logger.error('Failed to get top consumers:', error);
            return [];
        }
    }
    async getTotalActiveKeys() {
        try {
            const keys = await this.redis.keys(`${this.keyPrefix}*`);
            return keys.length;
        }
        catch (error) {
            this.logger.error('Failed to get total active keys:', error);
            return 0;
        }
    }
    async cleanupExpiredKeys() {
        try {
            const deleted = (await this.redis.eval(this.cleanupScript, 0, `${this.keyPrefix}*`, '1000'));
            if (deleted > 0) {
                this.logger.log(`Cleaned up ${deleted} expired rate limit keys`);
            }
            return deleted;
        }
        catch (error) {
            this.logger.error('Failed to cleanup expired keys:', error);
            return 0;
        }
    }
    getRateLimitKey(identifier) {
        return `${this.keyPrefix}${identifier}`;
    }
    getBlockKey(identifier) {
        return `${this.blockPrefix}${identifier}`;
    }
    startPeriodicCleanup() {
        setInterval(async () => {
            await this.cleanupExpiredKeys();
        }, 5 * 60 * 1000);
    }
    async healthCheck() {
        try {
            const start = Date.now();
            await this.redis.ping?.();
            const latency = Date.now() - start;
            return { status: 'healthy', latency };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async getMetrics() {
        try {
            const info = await this.redis.info('memory,stats,clients');
            const lines = info.split('\r\n');
            const metrics = {};
            lines.forEach((line) => {
                const [key, value] = line.split(':');
                if (key && value) {
                    metrics[key] = value;
                }
            });
            return {
                totalKeys: await this.getTotalActiveKeys(),
                memory: metrics['used_memory_human'] || 'N/A',
                connections: parseInt(metrics['connected_clients'] || '0', 10),
                commandsProcessed: parseInt(metrics['total_commands_processed'] || '0', 10),
            };
        }
        catch (error) {
            this.logger.error('Failed to get Redis metrics:', error);
            return {
                totalKeys: 0,
                memory: 'N/A',
                connections: 0,
                commandsProcessed: 0,
            };
        }
    }
};
exports.RedisRateLimiter = RedisRateLimiter;
exports.RedisRateLimiter = RedisRateLimiter = RedisRateLimiter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisRateLimiter);
//# sourceMappingURL=radis-rate-limiter.service.js.map