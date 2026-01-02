import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Request, Response } from 'express';
import { Model } from 'mongoose';

import { AttackDetector } from './attack-detector.service';
import { SecurityLog } from 'src/models/securitylog.schema';

@Injectable()
export class SecurityLogger {
  private readonly logger = new Logger(SecurityLogger.name);

  constructor(
    @InjectModel('SecurityLog')
    private readonly securityLogModel: Model<SecurityLog>,
    private readonly attackDetector: AttackDetector,
  ) {}

  async logSecurityEvent(
    req: Request,
    res: Response,
    blocked: boolean,
    reason?: string,
  ): Promise<void> {
    try {
      const doc = new this.securityLogModel({
        ip: this.getClientIP(req),
        userAgent: req.headers['user-agent'] || '',
        endpoint: req.path,
        method: req.method,
        userId: (req as any).user?._id,
        timestamp: new Date(),
        riskScore: this.calculateRiskScore(req),
        blocked,
        reason,
      });
      await doc.save();
    } catch (error) {
      this.logger.error('Failed to log security event', error as Error);
    }
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

  private calculateRiskScore(req: Request): number {
    let score = 0;

    // User agent
    if (this.isSuspiciousUserAgent((req.headers['user-agent'] as string) || ''))
      score += 20;

    // Attack patterns
    if (this.attackDetector.detectAttackPatterns(req)) score += 50;

    // Unusual request size
    const contentLength = parseInt(
      (req.headers['content-length'] as string) || '0',
      10,
    );
    if (contentLength > 1_000_000) score += 15; // 1MB+

    // Time-based analysis (simplified)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) score += 5; // Outside business hours

    return Math.min(score, 100);
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    if (!userAgent) return true;

    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java\b/i,
      /nmap/i,
      /sqlmap/i,
      /nikto/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
  }
}
