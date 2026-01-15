import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare const Workspace: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare class WorkspaceGuard implements CanActivate {
    private readonly logger;
    canActivate(context: ExecutionContext): boolean;
}
