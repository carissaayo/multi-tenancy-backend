import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkspaceInviteService } from '../services/workspace-invite.service';

import { WorkspaceInviteDto } from '../dtos/workspace-invite.dto';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';

@ApiTags('Workspace Invitations')
@Controller('workspaces/:id/invitations')
export class WorkspaceInviteController {
  constructor(private readonly workspaceService: WorkspaceInviteService) {}

  // Create a new workspace
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send workspace invitation' })
  @ApiResponse({
    status: 201,
    description: 'Workspace invitation sent successfully',
  })
  sendInvitation(
    @Param('id') workspaceId: string,
    @Req() req: AuthenticatedRequest,
    @Body() inviteDto: WorkspaceInviteDto,
  ) {
    return this.workspaceService.inviteByEmail(workspaceId, req, inviteDto);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send workspace invitation' })
  @ApiResponse({
    status: 201,
    description: 'Workspace invitation sent successfully',
  })
  acceptInvitation(
    @Param('token') token: string,
    @Param('userId') userId: string,
  ) {
    return this.workspaceService.acceptInvitation(token);
  }
}
