import type { Request, Response } from 'express';
export declare class CorsHandler {
    private readonly allowedOrigins;
    private readonly logger;
    constructor();
    handleCORS(req: Request, res: Response): boolean;
}
