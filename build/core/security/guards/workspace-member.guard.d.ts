import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class WorkspaceMemberGuard implements CanActivate {
    private readonly logger;
    canActivate(context: ExecutionContext): boolean;
}
