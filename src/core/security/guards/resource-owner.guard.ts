import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { customError } from 'src/core/error-handler/custom-errors';

export const RequireOwnership = (resourceField: string = 'created_by') =>
  SetMetadata('resource-ownership', resourceField);

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  private readonly logger = new Logger(ResourceOwnerGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const resourceField = this.reflector.get<string>(
      'resource-ownership',
      context.getHandler(),
    );

    if (!resourceField) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resource = request.resource; // Should be set by a previous interceptor

    if (!resource) {
      throw customError.forbidden('Resource not found');
    }

    const resourceOwnerId = resource[resourceField] || resource.member_id;

    if (resourceOwnerId !== user.id) {
      this.logger.warn(
        `Ownership denied: User ${user.id} is not owner of resource`,
      );
      throw customError.forbidden('You can only modify your own resources');
    }

    this.logger.debug(`✅ Resource owner guard passed`);
    return true;
  }
}
