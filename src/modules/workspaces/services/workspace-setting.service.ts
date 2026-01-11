import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dtos/workspace.dto';
import { customError } from 'src/core/error-handler/custom-errors';
import {
  GetUserWorkspacesResponse,
  GetUserWorkspaceResponse,
  WorkspacePlan,
  UpdateWorkspaceResponse,
} from '../interfaces/workspace.interface';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { WorkspaceQueryService } from './workspace-query.service';
import { WorkspaceMembershipService } from './workspace-membership.service';
import { WorkspaceLifecycleService } from './workspace-lifecycle.service';
import { WorkspaceMember } from 'src/modules/members/entities/member.entity';

@Injectable()
export class WorkspaceSettingService {
  private readonly logger = new Logger(WorkspaceSettingService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly workspaceQueryService: WorkspaceQueryService,
    private readonly workspaceMembershipService: WorkspaceMembershipService,
    private readonly workspaceLifecycleService: WorkspaceLifecycleService,
  ) {}

  /**
   * Get a single workspace for a user (with membership check)
   */
  async getUserSingleWorkspace(
    req: AuthenticatedRequest,
  ): Promise<GetUserWorkspaceResponse> {
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      throw customError.badRequest('Workspace Id is missing');
    }
    return this.workspaceMembershipService.getUserSingleWorkspace(
      workspaceId,
      req,
    );
  }

  /**
   * Update workspace properties
   */
  async updateWorkspaceProperties(
    req: AuthenticatedRequest,
    updateDto: UpdateWorkspaceDto,
  ): Promise<UpdateWorkspaceResponse> {
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      throw customError.badRequest('Workspace Id is missing');
    }
    return this.workspaceLifecycleService.updateWorkspaceProperties(
      workspaceId,
      req,
      updateDto,
    );
  }

  /**
   * Upload and update workspace logo
   */
  async updateWorkspaceLogo(
    req: AuthenticatedRequest,
    file: Express.Multer.File,
  ): Promise<UpdateWorkspaceResponse> {
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      throw customError.badRequest('Workspace Id is missing');
    }
    return this.workspaceLifecycleService.updateWorkspaceLogo(
      workspaceId,
      req,
      file,
    );
  }

  /**
   * Soft delete workspace (deactivate)
   */
  async deactivate(req: AuthenticatedRequest): Promise<void> {
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      throw customError.badRequest('Workspace Id is missing');
    }
    return this.workspaceLifecycleService.deactivate(workspaceId, req.userId);
  }

  /**
   * Permanently delete workspace
   */
  async permanentlyDelete(req: AuthenticatedRequest): Promise<void> {
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      throw customError.badRequest('Workspace Id is missing');
    }
    return this.workspaceLifecycleService.permanentlyDelete(
      workspaceId,
      req.userId,
    );
  }

  /**
   * Update workspace plan (upgrade/downgrade)
   */
  async updatePlan(
    
    req: AuthenticatedRequest,
    newPlan: WorkspacePlan,
  ): Promise<Workspace> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      throw customError.badRequest('Workspace Id is missing');
    }
    const workspace = await this.workspaceQueryService.findById(workspaceId);

    // Only owner can change plan
    if (workspace.createdBy !== user.id) {
      throw customError.forbidden('Only workspace owner can change plan');
    }

    // Validate plan downgrade doesn't exceed limits
    if (newPlan === 'free' && workspace.plan !== 'free') {
      await this.validatePlanDowngrade(workspace);
    }

    workspace.plan = newPlan;
    workspace.updatedAt = new Date();

    await this.workspaceRepo.save(workspace);

    this.logger.log(`Workspace plan updated: ${workspace.slug} → ${newPlan}`);

    return workspace;
  }

  /**
   * Validate workspace can be downgraded to free plan
   */
  private async validatePlanDowngrade(workspace: Workspace): Promise<void> {
    const stats = await this.workspaceQueryService.getWorkspaceStats(workspace.id);

    const freeLimits = {
      maxMembers: 10,
      maxStorageMB: 5 * 1024, // 5GB
    };

    if (stats.memberCount > freeLimits.maxMembers) {
      throw customError.badRequest(
        `Cannot downgrade: Free plan allows max ${freeLimits.maxMembers} members`,
      );
    }

    if (stats.storageUsed > freeLimits.maxStorageMB) {
      throw customError.badRequest(
        `Cannot downgrade: Storage exceeds free plan limit`,
      );
    }
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(req: AuthenticatedRequest): Promise<{
    memberCount: number;
    channelCount: number;
    messageCount: number;
    fileCount: number;
    storageUsed: number;
  }> {
    const workspaceId = req.workspaceId;
    if (!workspaceId) {
      throw customError.badRequest('Workspace Id is missing');
    }
    return this.workspaceQueryService.getWorkspaceStats(workspaceId);
  }
}
