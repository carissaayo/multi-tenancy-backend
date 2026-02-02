import {
  Controller,
  Body,
  Req,
  Get,
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
import {  UpdateWorkspaceDto } from '../dtos/workspace.dto';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { Workspace } from '../entities/workspace.entity';
import {
  GetUserWorkspaceResponse,
  NoDataWorkspaceResponse,
  UpdateWorkspaceResponse,
  WorkspacePlan,
} from '../interfaces/workspace.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { customError } from 'src/core/error-handler/custom-errors';
import { WorkspaceSettingService } from '../services/workspace-setting.service';

@ApiTags('Workspace Settings')
@Controller('settings')
export class WorkspaceSettingsController {
  constructor(
    private readonly workspaceSettingService: WorkspaceSettingService,
  ) {}

  // Get single workspace by ID
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get workspace by ID (with membership check)' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  getById(@Req() req: AuthenticatedRequest): Promise<GetUserWorkspaceResponse> {
    return this.workspaceSettingService.getUserSingleWorkspace(req);
  }

  // Update workspace details
  @Patch()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update workspace properties excluding slug' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  update(
    @Body() updateDto: UpdateWorkspaceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UpdateWorkspaceResponse> {
    return this.workspaceSettingService.updateWorkspaceProperties(
      req,
      updateDto,
    );
  }

  @Patch('/logo')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload workspace logo' })
  @ApiResponse({
    status: 200,
    description: 'Workspace logo updated successfully',
  })
  @UseInterceptors(FileInterceptor('logo'))
  updateLogo(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<UpdateWorkspaceResponse> {
    if (!file) {
      throw customError.badRequest('No file provided');
    }
    return this.workspaceSettingService.updateWorkspaceLogo(req, file);
  }

  // Deactivate (soft delete) a workspace
  @Patch('deactivate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Deactivate (soft delete) a workspace' })
  @ApiResponse({
    status: 200,
    description: 'Workspace deactivated successfully',
  })
  deactivate(
    @Req() req: AuthenticatedRequest,
  ): Promise<NoDataWorkspaceResponse> {
    return this.workspaceSettingService.deactivate(req);
  }

  // Activate a workspace
  @Patch('activate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Activate a workspace' })
  @ApiResponse({
    status: 200,
    description: 'Workspace activated successfully',
  })
  activate(
    @Req() req: AuthenticatedRequest,
  ): Promise<NoDataWorkspaceResponse> {
    return this.workspaceSettingService.activate(req);
  }

  // soft delete a workspace
  @Delete()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  delete(@Req() req: AuthenticatedRequest): Promise<NoDataWorkspaceResponse> {
    return this.workspaceSettingService.delete(req);
  }

  // Update workspace plan (upgrade/downgrade)
  @Patch('plan')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update workspace plan (upgrade/downgrade)' })
  @ApiResponse({ status: 200, description: 'Workspace plan updated' })
  updatePlan(
    @Query('plan') newPlan: WorkspacePlan,
    @Req() req: AuthenticatedRequest,
  ): Promise<Workspace> {
    return this.workspaceSettingService.updatePlan(req, newPlan);
  }

  // Get workspace statistics
  @Get('stats')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get workspace statistics' })
  @ApiResponse({ status: 200, description: 'Workspace stats' })
  getStats(@Req() req: AuthenticatedRequest) {
    return this.workspaceSettingService.getWorkspaceStats(req);
  }
}
