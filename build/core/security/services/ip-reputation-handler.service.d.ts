import type { Request, Response } from 'express';
import { AttackDetector } from './attack-detector.service';
export declare class IpReputationHandler {
    private readonly attackDetector;
    private readonly suspiciousIPs;
    constructor(attackDetector: AttackDetector);
    checkIPReputation(req: Request, res: Response): boolean;
    private getClientIP;
    private isSuspiciousUserAgent;
}
