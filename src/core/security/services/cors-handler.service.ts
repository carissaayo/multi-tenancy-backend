/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

@Injectable()
export class CorsHandler {
  private readonly allowedOrigins: string[] = (() => {
    const origins: string[] = [];
    origins.push('http://localhost:3000');

    if (process.env.FRONTEND_URL) {
      const frontendUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, '');
      if (frontendUrl) {
        origins.push(frontendUrl);
      }
    }

    if (process.env.ALLOWED_ORIGINS) {
      const additionalOrigins = process.env.ALLOWED_ORIGINS
        .split(',')
        .map(origin => origin.trim().replace(/\/$/, ''))
        .filter(origin => origin.length > 0);
      origins.push(...additionalOrigins);
    }

    return [...new Set(origins)];
  })();

  private readonly logger = new Logger(CorsHandler.name);

  constructor() {
    this.logger.log(`CORS enabled for origins: ${JSON.stringify(this.allowedOrigins)}`);
  }

  handleCORS(req: Request, res: Response): boolean {
    const origin = req.headers.origin as string | undefined;
    const method = req.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      if (origin && this.allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        );
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, X-Requested-With, X-API-Key, x-workspace-slug, refreshtoken',
        );
        res.setHeader(
          'Access-Control-Expose-Headers',
          'X-New-Access-Token, Authorization',
        );
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
      } else {
        this.logger.warn(
          `CORS blocked OPTIONS request from origin: ${origin}. Allowed origins: ${JSON.stringify(this.allowedOrigins)}`,
        );
      }
      res.status(204).end();
      return false;
    }

    if (origin && this.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (origin) {
      this.logger.warn(
        `CORS blocked ${method} request from origin: ${origin}. Allowed origins: ${JSON.stringify(this.allowedOrigins)}`,
      );
    }

    return true;
  }
}
