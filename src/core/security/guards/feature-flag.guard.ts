import {
  SetMetadata,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { customError } from 'src/core/error-handler/custom-errors';

export const RequireFeature = (featureKey: string) =>
  SetMetadata('feature-flag', featureKey);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  private readonly logger = new Logger(FeatureFlagGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const featureKey = this.reflector.get<string>(
      'feature-flag',
      context.getHandler(),
    );

    if (!featureKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const workspace = request.workspace;

    if (!workspace) {
      throw customError.forbidden('Workspace context required');
    }

    // Check if workspace has access to this feature
    const hasFeature = workspace.features?.includes(featureKey);

    if (!hasFeature) {
      this.logger.warn(
        `Feature '${featureKey}' not available for workspace ${workspace.slug}`,
      );
      throw customError.forbidden(
        `This feature is not available on your current plan`,
      );
    }

    this.logger.debug(`✅ Feature flag guard passed: ${featureKey}`);
    return true;
  }
}
