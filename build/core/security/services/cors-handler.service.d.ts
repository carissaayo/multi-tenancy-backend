import type { Request, Response } from 'express';
export declare class CorsHandler {
    private readonly allowedOrigins;
    handleCORS(req: Request, res: Response): boolean;
}
