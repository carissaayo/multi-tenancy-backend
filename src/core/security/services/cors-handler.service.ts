/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

@Injectable()
export class CorsHandler {
  private readonly allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
  ];

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
          'Content-Type, Authorization, X-Requested-With, X-API-Key, x-workspace-slug, x-refresh-token',
        );
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
      }
      res.status(204).end();
      return false;
    }

    // Handle actual requests
    if (origin && this.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    return true;
  }
}
