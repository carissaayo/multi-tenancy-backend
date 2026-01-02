import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

@Injectable()
export class ResponseMonitor {
  monitorResponse(req: Request, res: Response, startTime: number): void {
    const originalSend = res.send;
    // Override send to add response time header
    (res as any).send = function (body: any) {
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);

      if (responseTime > 5000) {
        // Log slow requests
        console.warn(
          `Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`,
        );
      }

      return (originalSend as any).call(this, body);
    };
  }
}
