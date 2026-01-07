import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  Patch,
  Delete,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkspacesService } from '../services/workspace.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dtos/workspace.dto';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { Workspace } from '../entities/workspace.entity';
import { GetUserWorkspaceResponse, GetUserWorkspacesResponse, UpdateWorkspaceResponse, WorkspacePlan } from '../interfaces/workspace.interface';



@ApiTags('Workspaces')
@Controller('workspaces')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
export class WorkspacesController {
  constructor(private readonly workspaceService: WorkspacesService) {}

  // Create a new workspace
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  create(
    @Body() createDto: CreateWorkspaceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    workspace: Workspace | null;
    accessToken: string;
    refreshToken: string;
    message: string;
  }> {
    return this.workspaceService.create(req, createDto);
  }

  // Get authenticated user's workspaces
  @Get('')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all workspaces for authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user workspaces' })
  getUserWorkspaces(
    @Req() req: AuthenticatedRequest,
  ): Promise<GetUserWorkspacesResponse> {
    return this.workspaceService.getUserWorkspaces(req);
  }

  // Get single workspace by ID
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get workspace by ID (with membership check)' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  getById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<GetUserWorkspaceResponse> {
    return this.workspaceService.getUserSingleWorkspace(id, req);
  }

  //   @Get('slug/:slug')
  //   @ApiBearerAuth('access-token')
  //   @ApiOperation({ summary: 'Get workspace by slug' })
  //   @ApiResponse({ status: 200, description: 'Workspace details' })
  //   getBySlug(@Param('slug') slug: string): Promise<Workspace> {
  //     return this.workspaceService.findBySlug(slug);
  //   }

  // Update workspace details
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update workspace properties excluding slug' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  update(
    @Param('id') workspaceId: string,
    @Body() updateDto: UpdateWorkspaceDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UpdateWorkspaceResponse> {
    return this.workspaceService.updateWorkspaceProperties(
      workspaceId,
      req,
      updateDto,
    );
  }

  // Deactivate (soft delete) a workspace
  @Patch(':id/deactivate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Deactivate (soft delete) a workspace' })
  @ApiResponse({
    status: 200,
    description: 'Workspace deactivated successfully',
  })
  deactivate(
    @Param('id') workspaceId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.workspaceService.deactivate(workspaceId, req.userId);
  }

  // Permanently delete a workspace
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Permanently delete a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace permanently deleted' })
  permanentlyDelete(
    @Param('id') workspaceId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.workspaceService.permanentlyDelete(workspaceId, req.userId);
  }

  // Update workspace plan (upgrade/downgrade)
  @Patch(':id/plan')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update workspace plan (upgrade/downgrade)' })
  @ApiResponse({ status: 200, description: 'Workspace plan updated' })
  updatePlan(
    @Param('id') workspaceId: string,
    @Query('plan') newPlan: WorkspacePlan,
    @Req() req: AuthenticatedRequest,
  ): Promise<Workspace> {
    return this.workspaceService.updatePlan(workspaceId, req.userId, newPlan);
  }

  // Get workspace statistics
  @Get(':id/stats')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get workspace statistics' })
  @ApiResponse({ status: 200, description: 'Workspace stats' })
  getStats(@Param('id') workspaceId: string) {
    return this.workspaceService.getWorkspaceStats(workspaceId);
  }
}
