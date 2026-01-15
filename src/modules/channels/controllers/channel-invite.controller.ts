import { Controller, Req, Param, Patch, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ChannelInviteService } from '../services/channel-invite.service';

import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { ChannelInviteDto } from '../dtos/channel-invite.dto';

@ApiTags('Channel Invitations')
@Controller('channels')
export class ChannelInviteController {
  constructor(
    private readonly channelInviteService: ChannelInviteService,
  ) {}

  // Invite a member to join a private channel
  @Patch(':id/invite')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Invite a member to join a private channel' })
  @ApiResponse({
    status: 200,
    description: 'You have successfully invited a member to join a private channel',
  })
  inviteToJoinPrivateChannel(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() channelInviteDto: ChannelInviteDto) {
    return this.channelInviteService.inviteToJoinPrivateChannel(req, id, channelInviteDto);
  }

  @Patch(':invitationId/revoke')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke a channel invitation' })
  @ApiResponse({
    status: 200,
    description: 'Channel invitation revoked successfully',
  })
  revokeInvitation(@Param('invitationId') invitationId: string, @Req() req: AuthenticatedRequest) {
    return this.channelInviteService.revokeInvitation(invitationId, req);
  }
}
