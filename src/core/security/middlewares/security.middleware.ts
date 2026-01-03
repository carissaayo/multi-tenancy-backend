import { Injectable, NestMiddleware, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { CorsHandler } from '../services/cors-handler.service';
import { RateLimitHandler } from '../services/rate-limit-handler.service';
import { IpReputationHandler } from '../services/ip-reputation-handler.service';
import { InputSanitizer } from '../services/input-sanitizer.service';
import { AuthHandler } from '../services/auth-handler.service';
// import { SecurityLogger } from '../services/security.logger.service';
import { ResponseMonitor } from '../services/response-monitor.service';
import { publicRoutes } from '../constants/public-routes';



@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(
    private readonly corsHandler: CorsHandler,
    private readonly rateLimitHandler: RateLimitHandler,
    private readonly ipReputationHandler: IpReputationHandler,
    private readonly inputSanitizer: InputSanitizer,
    private readonly authHandler: AuthHandler,
    // private readonly securityLogger: SecurityLogger,
    private readonly responseMonitor: ResponseMonitor,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<any> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `SecurityMiddleware: incoming request → path="${req.path}", originalUrl="${req.originalUrl}"`,
      );

      // Apply basic security headers
      this.applySecurityHeaders(req, res);

      // CORS handling
      if (!this.corsHandler.handleCORS(req, res)) return;

      // Rate limiting
      if (!(await this.rateLimitHandler.checkRateLimit(req, res))) return;

      // IP reputation check
      if (!this.ipReputationHandler.checkIPReputation(req, res)) return;

      // Input sanitization
      this.inputSanitizer.sanitizeInput(req, res);

      // Content Security Policy
      this.applyCSP(res);

      // JWT Authentication (skip for public routes)
      if (!this.isPublicRoute(req.originalUrl)) {
        const authResult = await this.authHandler.authenticateToken(req, res);
        if (!authResult.success) return;
        // attach user for downstream usage
        console.log(authResult);

        (req as any).user = authResult.user;
        (req as any).userId = String(authResult.user?.id);
      }
      

      // // Request logging and anomaly detection
      // await this.securityLogger.logSecurityEvent(req, res, false);

      // Monitor response
      this.responseMonitor.monitorResponse(req, res, startTime);

      return next();
    } catch (error: any) {
      this.logger.error(
        `Security middleware error: ${error?.message}`,
        error?.stack,
      );
      // await this.securityLogger.logSecurityEvent(
      //   req,
      //   res,
      //   true,
      //   `Middleware error: ${error?.message}`,
      // );

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Security check failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private applySecurityHeaders(_req: Request, res: Response): void {
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()',
    );
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );

    // Custom security headers
    res.setHeader('X-Request-ID', this.generateRequestId());
    res.setHeader('X-Timestamp', Date.now().toString());
  }

  private applyCSP(res: Response): void {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.yourdomain.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    res.setHeader('Content-Security-Policy', csp);
  }

isPublicRoute(path: string): boolean {
  return publicRoutes.some((route) => {
    // Convert routes like '/repayments/verify-repayment/:txRef'
    // into a regex: /^\/repayments\/verify-repayment\/[^/]+$/
    const regex = new RegExp('^' + route.replace(/:[^/]+/g, '[^/]+') + '$');
    return regex.test(path);
  });
}

  private generateRequestId(): string {
    return require('crypto').randomBytes(16).toString('hex');
  }
}
