import {
  Controller,
  Post,
  Body,
  Req,
  Param,
  Patch,
  Query,
  Get,
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
@Controller('invitations')
export class WorkspaceInviteController {
  constructor(private readonly workspaceService: WorkspaceInviteService) {}

  // Get all invitations sent to the current user (for accepting without email)
  @Get('my')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all pending invitations for current user' })
  @ApiResponse({
    status: 200,
    description: 'User invitations retrieved successfully',
  })
  getMyInvitations(@Req() req: AuthenticatedRequest) {
    return this.workspaceService.getMyInvitations(req);
  }

  // Get all workspace invitations (admin view)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all workspace invitations' })
  @ApiResponse({
    status: 200,
    description: 'Workspace invitations retrieved successfully',
  })
  getInvitations(@Req() req: AuthenticatedRequest) {
    return this.workspaceService.listWorkspaceInvites(req);
  }

  // send a workspace invitation
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send workspace invitation' })
  @ApiResponse({
    status: 201,
    description: 'Workspace invitation sent successfully',
  })
  sendInvitation(
    @Req() req: AuthenticatedRequest,
    @Body() inviteDto: WorkspaceInviteDto,
  ) {
    return this.workspaceService.inviteByEmail(req, inviteDto);
  }

  @Patch('revoke/:inviteId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke workspace invitation' })
  @ApiResponse({
    status: 200,
    description: 'Workspace invitation revoked successfully',
  })
  revokeInvitation(
    @Req() req: AuthenticatedRequest,
    @Param('inviteId') inviteId: string,
  ) {
    return this.workspaceService.revokeInvite(inviteId, req);
  }

  @Patch('accept')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send workspace invitation' })
  @ApiResponse({
    status: 201,
    description: 'Workspace invitation sent successfully',
  })
  acceptInvitation(@Query('token') token: string) {
    return this.workspaceService.acceptInvitation(token);
  }
}
