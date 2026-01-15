import { Request } from 'express';
export declare class AttackDetector {
    private readonly attackPatterns;
    detectAttackPatterns(req: Request): boolean;
    private containsKeyDeep;
}
