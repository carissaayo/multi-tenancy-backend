import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpsRedirectMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Only enforce in production
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // Check if request is already HTTPS
    const proto = req.headers['x-forwarded-proto'] || req.protocol;

    // If not HTTPS, redirect
    if (proto !== 'https') {
      const host = req.headers.host;
      const url = req.originalUrl || req.url;
      return res.redirect(301, `https://${host}${url}`);
    }

    next();
  }
}
