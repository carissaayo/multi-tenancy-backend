import { ExecutionContext, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsEnum } from '../interfaces/permission.interface';
export declare const RequirePermissions: (...permissions: PermissionsEnum[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireAllPermissions: (...permissions: PermissionsEnum[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare class PermissionGuard implements CanActivate {
    private reflector;
    private readonly logger;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
