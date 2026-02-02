import { Controller, Req, Param, Patch, Delete, Body, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ChannelManagementService } from '../services/channel-management.service';

import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { RemoveMemberFromChannelDto, AddMemberToChannelDto } from '../dtos/channel-management.dto';

@ApiTags('Channel Management')
@Controller('channels')
export class ChannelManagementController {
  constructor(
    private readonly channelManagementService: ChannelManagementService,
  ) {}

  // Join a channel
  @Patch(':id/join')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Join a channel' })
  @ApiResponse({
    status: 200,
    description: 'You have successfully joined the channel',
  })
  joinChannel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.channelManagementService.joinChannel(req, id);
  }

  // Leave a channel
  @Patch(':id/leave')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Leave a channel' })
  @ApiResponse({
    status: 200,
    description: 'You have successfully left the channel',
  })
  leaveChannel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.channelManagementService.leaveChannel(req, id);
  }

  // Remove a member from a channel
  @Delete(':id/members/remove')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove a member from a channel' })
  @ApiResponse({
    status: 200,
    description: 'Member removed from channel successfully',
  })
  removeMemberFromChannel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: RemoveMemberFromChannelDto,
  ) {
    return this.channelManagementService.removeMemberFromChannel(
      req,
      id,
      dto,
    );
  }

  // Add a member to a channel (works for both public and private channels)
  @Post(':id/members/add')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add a member to a channel (public or private)' })
  @ApiResponse({
    status: 201,
    description: 'Member added to channel successfully',
  })
  addMemberToChannel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AddMemberToChannelDto,
  ) {
    return this.channelManagementService.addToChannel(req, id, dto);
  }
}
