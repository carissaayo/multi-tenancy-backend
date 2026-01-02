import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { customError } from 'src/core/error-handler/custom-errors';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  private readonly logger = new Logger(WorkspaceMemberGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const workspace = request.workspace;
    const member = request.workspaceMember;

    if (!user || !workspace) {
      throw customError.forbidden('Authentication and workspace required');
    }

    if (!member) {
      this.logger.warn(
        `User ${user.id} is not a member of workspace ${workspace.id}`,
      );
      throw customError.forbidden('You are not a member of this workspace');
    }

    if (!member.is_active) {
      this.logger.warn(
        `User ${user.id} membership is inactive in workspace ${workspace.id}`,
      );
      throw customError.forbidden('Your workspace membership is inactive');
    }

    this.logger.debug(
      `✅ Workspace member guard passed: User ${user.id} in workspace ${workspace.slug}`,
    );
    return true;
  }
}
