import type { Request, Response } from 'express';
export declare class InputSanitizer {
    sanitizeInput(req: Request, res: Response): void;
    private sanitizeObject;
    private sanitizeObjectInPlace;
}
