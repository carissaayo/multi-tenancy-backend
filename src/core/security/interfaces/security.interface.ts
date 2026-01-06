import { User } from "src/modules/users/entities/user.entity";


export interface RateLimitResult {
  totalHits: number;
  resetTime: Date;
  remaining: number;
  isBlocked: boolean;
  retryAfter?: number; // seconds
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs?: number; // How long to block after exceeding limit
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
  user?: User ;
  userType?: AuthUserType;
}
