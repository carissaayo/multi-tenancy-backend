import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import xss from 'xss';
import hpp from 'hpp';

@Injectable()
export class InputSanitizer {
  sanitizeInput(req: Request, res: Response): void {
    // Sanitize request body (body is mutable)
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query params (must modify in place, not reassign)
    if (req.query && typeof req.query === 'object') {
      this.sanitizeObjectInPlace(req.query);
    }

    // Sanitize route params (must modify in place, not reassign)
    if (req.params && typeof req.params === 'object') {
      this.sanitizeObjectInPlace(req.params);
    }

    // Prevent HTTP parameter pollution
    (hpp() as any)(req, res, () => {});
  }

  // For objects that can be reassigned (like req.body)
  private sanitizeObject(value: any): any {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeObject(item));
    }

    if (value && typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const key of Object.keys(value)) {
        sanitized[key] = this.sanitizeObject(value[key]);
      }
      return sanitized;
    }

    if (typeof value === 'string') {
      return xss(value.trim());
    }

    return value;
  }

  // For objects that must be modified in place (like req.query, req.params)
  private sanitizeObjectInPlace(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      const value = obj[key];

      if (typeof value === 'string') {
        obj[key] = xss(value.trim());
      } else if (Array.isArray(value)) {
        obj[key] = value.map((item) =>
          typeof item === 'string' ? xss(item.trim()) : item,
        );
      } else if (value && typeof value === 'object') {
        this.sanitizeObjectInPlace(value);
      }
    }
  }
}
