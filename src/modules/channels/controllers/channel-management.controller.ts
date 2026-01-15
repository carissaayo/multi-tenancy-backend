import {
  Controller,
  Req,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation, 
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ChannelManagementService } from '../services/channel-management.service';


import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';

@ApiTags('Channel Management')
@Controller('channels')
export class ChannelManagementController {
  constructor(private readonly channelManagementService: ChannelManagementService) {}

 
  // Update a channel
  @Patch(':id/join')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Join a channel' })
  @ApiResponse({
    status: 200,
    description: 'You have successfully joined the channel',
  })
  joinChannel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.channelManagementService.joinChannel(req, id);
  }

  
}
