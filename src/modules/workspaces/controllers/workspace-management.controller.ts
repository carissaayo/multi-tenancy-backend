import {
  Controller,
  Body,
  Req,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { WorkspaceManagementService } from '../services/workspace-management.service';
import { ChangeMemberRoleDto, DeactivateMemberDto, RemoveUserFromWorkspaceDto, TransferOwnershipDto } from '../dtos/workspace-management.dto';

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

  // Remove user from workspace
  @Delete('members/remove')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove user from workspace' })
  @ApiResponse({
    status: 200,
    description: 'User has been removed from workspace successfully',
  })
  removeUserFromWorkspace(
    @Req() req: AuthenticatedRequest,
    @Body() removeUserFromWorkspaceDto: RemoveUserFromWorkspaceDto,
  ) {
    return this.workspaceManagementService.removeUserFromWorkspace(
      removeUserFromWorkspaceDto,
      req,
    );
  }

  // Leave workspace
  @Patch('leave')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Leave workspace' })
  @ApiResponse({
    status: 200,
    description: 'You have left the workspace successfully',
  })
  leaveWorkspace(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.workspaceManagementService.leaveWorkspace(req); 
  }


  // Deactivate member
  @Patch('members/deactivate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Deactivate member' })
  @ApiResponse({
    status: 200,
    description: 'Member has been deactivated successfully',
  })
  deactivateMember(
    @Req() req: AuthenticatedRequest,
    @Body() deactivateMemberDto: DeactivateMemberDto,
  ) {
    return this.workspaceManagementService.deactivateMember(req, deactivateMemberDto);
  }

  // Transfer ownership
  @Patch('transfer-ownership')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Transfer ownership' })
  @ApiResponse({
    status: 200,
    description: 'Ownership has been transferred successfully',
  })
  transferOwnership(
    @Req() req: AuthenticatedRequest,
    @Body() transferOwnershipDto: TransferOwnershipDto,
  ) {
    return this.workspaceManagementService.transferOwnership(req, transferOwnershipDto);
  }
}
