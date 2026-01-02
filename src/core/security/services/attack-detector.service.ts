import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AttackDetector {
  private readonly attackPatterns = [
    /(\bor\b|\band\b).*['"].*['"]/,
    /union.*select/,
    /insert.*into/,
    /delete.*from/,
    /<script\b/,
    /javascript:/,
    /onerror\s*=/,
    /onload\s*=/,
    /\.\.\//,
    /\.\.\\/,
    /etc\/passwd/,
    /windows\/system32/,
    /;\s*(ls|cat|wget|curl|nc|netcat)/,
    /`.*`/,
    /\$\(.*\)/,
    /\$where/,
    /\$ne/,
    /\$regex/,
    /\$gt/,
    /\$lt/,
  ];

  detectAttackPatterns(req: Request): boolean {
    const url = (req.originalUrl || req.url || '').toLowerCase();
    const bodyObj = req.body && typeof req.body === 'object' ? req.body : {};
    const query = JSON.stringify(req.query || {}).toLowerCase();

    // 👉 If applicationFields exists anywhere in the body, skip scanning
    if (this.containsKeyDeep(bodyObj, 'applicationFields')) {
      console.log(
        "AttackDetector: Skipping scan because 'applicationFields' found",
      );
      return false;
    }

    // Otherwise, scan normally
    const bodyStr = JSON.stringify(bodyObj || {}).toLowerCase();
    const content = `${url} ${bodyStr} ${query}`;

    return this.attackPatterns.some((pattern) => pattern.test(content));
  }

  private containsKeyDeep(obj: any, targetKey: string): boolean {
    if (!obj || typeof obj !== 'object') return false;

    if (Object.prototype.hasOwnProperty.call(obj, targetKey)) {
      return true;
    }

    return Object.values(obj).some((val) =>
      this.containsKeyDeep(val, targetKey),
    );
  }
}
