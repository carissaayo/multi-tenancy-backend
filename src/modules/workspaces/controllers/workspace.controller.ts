import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @ApiOperation({ summary: 'Create a new workspace with optional logo' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  create(
    @Body() createDto: CreateWorkspaceDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{
    workspace: Workspace | null;
    accessToken: string;
    refreshToken: string;
    message: string;
  }> {
    return this.workspaceService.create(req, createDto, file);
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
  @Get(':id/members')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all members of a workspace' })
  @ApiResponse({ status: 200, description: 'List of workspace members' })
  getWorkspaceMembers(
    @Param('id') workspaceId: string,
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.workspaceService.getWorkspaceMembers(
      workspaceId,
      req,
      {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        role,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      },
    );
  }
}
