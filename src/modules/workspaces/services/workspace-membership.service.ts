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
import { RolePermissions } from 'src/core/security/interfaces/permission.interface';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { AWSStorageService } from 'src/core/storage/services/aws-storage.service';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly tokenManager: TokenManager,
    private storageService: AWSStorageService,
  ) {}

  /**
   * Add creator as owner member
   */
  private async addOwnerMember(
    workspaceId: string,
    slug: string,
    userId: string,
    queryRunner: any,
  ): Promise<void> {
    const sanitizedSlug = this.sanitizeSlugForSQL(slug);
    const schemaName = `workspace_${sanitizedSlug}`;

    const ownerPermissions = RolePermissions.owner.map((p) => p.toString());

    await queryRunner.query(
      `
    INSERT INTO "${schemaName}".members
      (user_id, role, permissions, is_active, joined_at)
    VALUES ($1, 'owner', $2::jsonb, true, NOW())
    `,
      [userId, JSON.stringify(ownerPermissions)],
    );

    this.logger.log(
      `Owner member added: user ${userId} → workspace ${workspaceId} (${schemaName})`,
    );
  }

  /**
   * Check if user is member of workspace
   */
  private async isUserMember(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) return false;

    const sanitizedSlug = this.sanitizeSlugForSQL(workspace.slug);
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      const [result] = await this.dataSource.query(
        `SELECT 1 FROM ${schemaName}.members 
         WHERE user_id = $1 AND is_active = true 
         LIMIT 1`,
        [userId],
      );

      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user can manage workspace (owner or admin)
   */
  private async canUserManageWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) return false;

    // Owner can always manage
    if (workspace.createdBy === userId) return true;

    // Check if user is admin
    const sanitizedSlug = this.sanitizeSlugForSQL(workspace.slug);
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      const [result] = await this.dataSource.query(
        `SELECT role FROM ${schemaName}.members 
         WHERE user_id = $1 AND is_active = true 
         LIMIT 1`,
        [userId],
      );

      return result && (result.role === 'admin' || result.role === 'owner');
    } catch (error) {
      return false;
    }
  }
}