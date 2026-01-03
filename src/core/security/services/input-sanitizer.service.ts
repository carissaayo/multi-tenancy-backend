import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import xss from 'xss';
import hpp from 'hpp';

@Injectable()
export class InputSanitizer {
  sanitizeInput(req: Request, res: Response): void {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize query params
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitize route params
    if (req.params && typeof req.params === 'object') {
      req.params = this.sanitizeObject(req.params);
    }

    // Prevent HTTP parameter pollution
    (hpp() as any)(req, res, () => {});
  }

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
}
