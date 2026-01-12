import {
  Controller,
  Body,
  Req,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { WorkspaceManagementService } from '../services/workspace-management.service';
import { ChangeMemberRoleDto } from '../dtos/workspace-management.dto';

@ApiTags('Workspace Management')
@Controller('management')
export class WorkspaceManagementController {
  constructor(
    private readonly workspaceManagementService: WorkspaceManagementService,
  ) {}

  // Update member role
  @Patch('members/role')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({
    status: 201,
    description: 'Member role has been updated successfully',
  })
  updateMemberRole(
    @Req() req: AuthenticatedRequest,
    @Body() changeMemberRoleDto: ChangeMemberRoleDto,
  ) {
    return this.workspaceManagementService.changeMemberRole(
      changeMemberRoleDto,
      req,
    );
  }
}
