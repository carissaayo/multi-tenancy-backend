import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  createParamDecorator,
} from '@nestjs/common';
import { customError } from 'src/core/error-handler/custom-errors';

export const Workspace = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.workspace;
  },
);

@Injectable()
export class WorkspaceGuard implements CanActivate {
  private readonly logger = new Logger(WorkspaceGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const workspace = request.workspace;

    if (!workspace) {
      this.logger.error('No workspace found in request');
      throw customError.forbidden('Workspace context required');
    }

    if (!workspace.is_active) {
      this.logger.warn(`Workspace ${workspace.id} is inactive`);
      throw customError.forbidden('Workspace is not active');
    }

    this.logger.debug(`✅ Workspace guard passed: ${workspace.slug}`);
    return true;
  }
}
