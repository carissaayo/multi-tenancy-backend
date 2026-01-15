import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const RequireOwnership: (resourceField?: string) => import("@nestjs/common").CustomDecorator<string>;
export declare class ResourceOwnerGuard implements CanActivate {
    private reflector;
    private readonly logger;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
