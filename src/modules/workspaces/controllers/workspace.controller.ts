import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkspacesService } from '../services/workspace.service';
import { CreateWorkspaceDto} from '../dtos/workspace.dto';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { Workspace } from '../entities/workspace.entity';
import { GetUserWorkspaceResponse, GetUserWorkspacesResponse} from '../interfaces/workspace.interface';

@ApiTags('Workspaces')
@Controller('workspaces')
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

}
