import { Controller, Post, Body, Req } from '@nestjs/common';
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
}
