import { Controller, Req, Param, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChannelMembershipService } from '../services/channel-membership.service';

import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';

@ApiTags('Channel Membership')
@Controller('channels')
export class ChannelMembershipController {
  constructor(
    private readonly channelMembershipService: ChannelMembershipService,
  ) {}

  // Get channel members
  @Get(':id/members')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get channel members' })
  @ApiResponse({
    status: 200,
    description: 'Channel members retrieved successfully',
  })
  getChannelMembers(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.channelMembershipService.getChannelMembers(req, id);
  }
}
