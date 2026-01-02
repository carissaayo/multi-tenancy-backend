import {
  SetMetadata,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { customError } from '../../error-handler/custom-errors';

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export const RequireRole = (...roles: WorkspaceRole[]) =>
  SetMetadata('roles', roles);

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const member = request.workspaceMember;

    if (!member) {
      throw customError.forbidden('Workspace membership required');
    }

    const hasRole = requiredRoles.includes(member.role);

    if (!hasRole) {
      this.logger.warn(
        `Role denied: User has role '${member.role}' but needs one of [${requiredRoles.join(', ')}]`,
      );
      throw customError.forbidden(
        `Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    this.logger.debug(`✅ Role guard passed: ${member.role}`);
    return true;
  }
}
