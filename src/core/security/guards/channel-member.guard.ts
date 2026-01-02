import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { customError } from 'src/core/error-handler/custom-errors';

export const RequireChannelMembership = () =>
  SetMetadata('require-channel-membership', true);

@Injectable()
export class ChannelMemberGuard implements CanActivate {
  private readonly logger = new Logger(ChannelMemberGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const channelMember = request.channelMember;
    const channelId = request.params.channelId || request.body.channelId;

    if (!channelMember) {
      this.logger.warn(
        `User ${request.user?.id} is not a member of channel ${channelId}`,
      );
      throw customError.forbidden('You are not a member of this channel');
    }

    this.logger.debug(
      `✅ Channel member guard passed: User ${request.user?.id} in channel ${channelId}`,
    );
    return true;
  }
}
