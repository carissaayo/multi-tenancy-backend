import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  CanActivate,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';


import { PermissionsEnum } from '../interfaces/permission.interface';
import { customError } from 'src/core/error-handler/custom-errors';

export const RequirePermissions = (...permissions: PermissionsEnum[]) =>
  SetMetadata('permissions', permissions);

export const RequireAllPermissions = (...permissions: PermissionsEnum[]) =>
  SetMetadata('all-permissions', permissions);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionsEnum[]
    >('permissions', [context.getHandler(), context.getClass()]);

    const requiredAllPermissions = this.reflector.getAllAndOverride<
      PermissionsEnum[]
    >('all-permissions', [context.getHandler(), context.getClass()]);

    if (!requiredPermissions && !requiredAllPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const userPermissions: string[] = user.permissions || [];

    if (requiredPermissions) {
      const hasAnyPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAnyPermission) {
        this.logger.warn(
          `Permission denied: User ${user.id} lacks any of [${requiredPermissions.join(', ')}]`,
        );
        throw customError.forbidden('You do not have the required permissions');
      }
    }

    if (requiredAllPermissions) {
      const hasAllPermissions = requiredAllPermissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAllPermissions) {
        this.logger.warn(
          `Permission denied: User ${user.id} lacks all of [${requiredAllPermissions.join(', ')}]`,
        );
        throw customError.forbidden('Insufficient permissions');
      }
    }

    this.logger.debug(`✅ Permission check passed for user ${user.id}`);
    return true;
  }
}
