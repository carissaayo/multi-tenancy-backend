import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import hpp from 'hpp';

@Injectable()
export class InputSanitizer {
  sanitizeInput(req: Request, res: Response): void {
    // MongoDB injection protection
    (mongoSanitize as any).sanitize?.(req.body);
    (mongoSanitize as any).sanitize?.(req.query);
    (mongoSanitize as any).sanitize?.(req.params);

    // XSS protection on body fields
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    // Parameter pollution protection
    (hpp() as any)(req, res, () => {});
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = xss(value);
        } else {
          sanitized[key] = this.sanitizeObject(value);
        }
      }
      return sanitized;
    }
    return obj;
  }
}
