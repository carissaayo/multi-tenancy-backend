import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../dtos/workspace.dto';
import { customError } from 'src/core/error-handler/custom-errors';
import {
  GetUserWorkspacesResponse,
} from '../interfaces/workspace.interface';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { RolePermissions } from 'src/core/security/interfaces/permission.interface';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { AWSStorageService } from 'src/core/storage/services/aws-storage.service';

@Injectable()
export class WorkspaceQueryService {
  private readonly logger = new Logger(WorkspaceQueryService.name);

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
   * Find workspace by ID
   */
  async findById(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    return workspace;
  }

  /**
   * Find workspace by slug
   */
  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.workspaceRepo.findOne({
      where: { slug },
      relations: ['creator'],
    });
  }

  /**
   * Get all workspaces for a user
   */
  async getUserWorkspaces(
    req: AuthenticatedRequest,
  ): Promise<GetUserWorkspacesResponse> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    // Get all workspaces where user is a member
    const workspaceSchemas = await this.dataSource.query(
      `
    SELECT DISTINCT table_schema as schema_name
    FROM information_schema.tables 
    WHERE table_name = 'members' 
    AND table_schema LIKE 'workspace_%'
    `,
    );

    // Find which workspaces the user is a member of
    const workspaceSlugs: string[] = [];

    for (const row of workspaceSchemas) {
      const schemaName = row.schema_name;

      try {
        // Check if user is a member in this workspace schema
        const [member] = await this.dataSource.query(
          `SELECT 1 FROM "${schemaName}".members 
         WHERE user_id = $1 AND is_active = true 
         LIMIT 1`,
          [user.id],
        );

        if (member) {
          // Extract slug from schema name (workspace_slug -> slug)
          // Handle both sanitized (underscores) and original (hyphens) slugs
          const slugFromSchema = schemaName
            .replace('workspace_', '')
            .replace(/_/g, '-');
          workspaceSlugs.push(slugFromSchema);
        }
      } catch (error) {
        // Schema might not exist or be accessible, skip it
        this.logger.warn(
          `Failed to check membership in schema ${schemaName}: ${error.message}`,
        );
      }
    }

    // Get workspace details from public schema
    if (workspaceSlugs.length === 0) {
      const tokens = await this.tokenManager.signTokens(user, req);
      return {
        workspaces: [],
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
        message: 'No workspaces found',
        totalWorkspacesCount: 0,
      };
    }
    // Query workspaces with safe user fields
    const workspaces = await this.getMultipleWorkspacesWithSafeFields(
      workspaceSlugs,
      true,
    );

    const tokens = await this.tokenManager.signTokens(user, req);

    return {
      workspaces: workspaces,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Workspaces fetched successfully',
      totalWorkspacesCount: workspaces.length,
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Get workspace with safe user fields (excludes sensitive data)
   * @param identifier - Workspace ID or slug
   * @param bySlug - If true, searches by slug; if false, searches by ID
   * @returns Workspace with safe user fields or null if not found
   */
  async findWorkspaceWithSafeFields(
    identifier: string,
    bySlug: boolean = false,
  ): Promise<Workspace | null> {
    const whereCondition = bySlug ? { slug: identifier } : { id: identifier };

    return this.workspaceRepo.findOne({
      where: whereCondition,
      relations: ['creator', 'owner'],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logoUrl: true,
        plan: true,
        isActive: true,
        settings: true,
        createdBy: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        owner: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    });
  }

  /** * Get multiple workspaces with safe user fields * @param identifiers - Array of workspace IDs or slugs * @param bySlug - If true, searches by slug; if false, searches by ID * @returns Array of workspaces with safe user fields */
  async getMultipleWorkspacesWithSafeFields(
    identifiers: string[],
    bySlug: boolean = false,
  ): Promise<Workspace[]> {
    if (identifiers.length === 0) {
      return [];
    }
    const { In } = await import('typeorm');
    const whereCondition = bySlug
      ? { slug: In(identifiers), isActive: true }
      : { id: In(identifiers), isActive: true };
    return this.workspaceRepo.find({
      where: whereCondition,
      relations: ['creator', 'owner'],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logoUrl: true,
        plan: true,
        isActive: true,
        settings: true,
        createdBy: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        owner: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }
  /**
   * Validate slug format
   */
  public async isValidSlug(slug: string): Promise<boolean> {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
  }

  /**
   * Sanitize slug for use in SQL identifiers
   * Replaces hyphens and other special characters with underscores
   */
  public sanitizeSlugForSQL(slug: string): string {
    // Replace hyphens with underscores for SQL identifier compatibility
    return slug.replace(/-/g, '_');
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    memberCount: number;
    channelCount: number;
    messageCount: number;
    fileCount: number;
    storageUsed: number;
  }> {
    const workspace = await this.findById(workspaceId);
    const sanitizedSlug = this.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    const [memberCount] = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "${schemaName}".members WHERE is_active = true`,
    );

    const [channelCount] = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "${schemaName}".channels`,
    );

    const [messageCount] = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM "${schemaName}".messages`,
    );

    const [fileStats] = await this.dataSource.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size 
       FROM "${schemaName}".files`,
    );

    return {
      memberCount: parseInt(memberCount.count),
      channelCount: parseInt(channelCount.count),
      messageCount: parseInt(messageCount.count),
      fileCount: parseInt(fileStats.count),
      storageUsed: parseInt(fileStats.total_size) / (1024 * 1024), // MB
    };
  }
}
