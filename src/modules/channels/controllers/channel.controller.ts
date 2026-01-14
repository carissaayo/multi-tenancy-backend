import { Controller, Post, Body, Req, Get, Param, Patch, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ChannelService } from '../services/channel.service';

import { CreateChannelDto, UpdateChannelDto } from '../dtos/channel.dto';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';

@ApiTags('Channels')
@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  // Create a new workspace
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new channel' })
  @ApiResponse({
    status: 201,
    description: 'Channel created successfully',
  })
  createChannel(
    @Req() req: AuthenticatedRequest,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    return this.channelService.createChannel(req, createChannelDto);
  }

  // Update a channel
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a channel' })
  @ApiResponse({
    status: 200,
    description: 'Channel updated successfully',
  })
  updateChannel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelService.updateChannel(req, id, updateChannelDto);
  }

  // Get a channel by id
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a channel by id' })
  @ApiResponse({
    status: 200,
    description: 'Channel retrieved successfully',
  })
  getChannel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.channelService.getChannel(req, id);
  }

  // Get all channels in a workspace
  @Get('')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all channels in a workspace' })
  @ApiResponse({
    status: 200,
    description: 'Channels retrieved successfully',
  })
  getAllChannelsInAWorkspace(@Req() req: AuthenticatedRequest) {
    return this.channelService.getAllChannelsInAWorkspace(req);
  }

  // Delete a channel
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a channel' })
  @ApiResponse({
    status: 200,
    description: 'Channel deleted successfully',
  })
  deleteChannel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.channelService.deleteChannel(req, id);
  }
}
