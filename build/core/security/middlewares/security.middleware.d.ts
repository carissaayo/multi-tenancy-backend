import { NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { CorsHandler } from '../services/cors-handler.service';
import { RateLimitHandler } from '../services/rate-limit-handler.service';
import { IpReputationHandler } from '../services/ip-reputation-handler.service';
import { InputSanitizer } from '../services/input-sanitizer.service';
import { AuthHandler } from '../services/auth-handler.service';
import { ResponseMonitor } from '../services/response-monitor.service';
export declare class SecurityMiddleware implements NestMiddleware {
    private readonly corsHandler;
    private readonly rateLimitHandler;
    private readonly ipReputationHandler;
    private readonly inputSanitizer;
    private readonly authHandler;
    private readonly responseMonitor;
    private readonly logger;
    constructor(corsHandler: CorsHandler, rateLimitHandler: RateLimitHandler, ipReputationHandler: IpReputationHandler, inputSanitizer: InputSanitizer, authHandler: AuthHandler, responseMonitor: ResponseMonitor);
    use(req: Request, res: Response, next: NextFunction): Promise<any>;
    private applySecurityHeaders;
    private applyCSP;
    isPublicRoute(path: string): boolean;
    private generateRequestId;
}
