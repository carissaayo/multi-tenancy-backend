import type { Request, Response } from 'express';
export declare class ResponseMonitor {
    monitorResponse(req: Request, res: Response, startTime: number): void;
}
