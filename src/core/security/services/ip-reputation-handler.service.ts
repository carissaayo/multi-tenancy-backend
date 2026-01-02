/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AttackDetector } from './attack-detector.service';

@Injectable()
export class IpReputationHandler {
  private readonly suspiciousIPs = new Set<string>();

  constructor(private readonly attackDetector: AttackDetector) {}

  checkIPReputation(req: Request, res: Response): boolean {
    const clientIP = this.getClientIP(req);

    // Check if IP is in suspicious list
    if (this.suspiciousIPs.has(clientIP)) {
      // Additional verification for suspicious IPs
      const userAgent = req.headers['user-agent'] as string | undefined;
      if (this.isSuspiciousUserAgent(userAgent || '')) {
        res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: 'Access denied',
          timestamp: new Date().toISOString(),
        });
        return false;
      }
    }

    // Check for common attack patterns
    if (this.attackDetector.detectAttackPatterns(req)) {
      this.suspiciousIPs.add(clientIP);
      res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Malicious request detected',
        timestamp: new Date().toISOString(),
      });
      return false;
    }

    return true;
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
