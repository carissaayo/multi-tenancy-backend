import { Controller, Post, Body, Req, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ChannelService } from '../services/channel.service';

import { CreateChannelDto } from '../dtos/channel.dto';
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
}
