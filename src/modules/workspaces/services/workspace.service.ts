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
   * Create a new workspace
   * - Creates workspace record in public schema
   * - Creates workspace schema in database
   * - Creates default channels (#general, #random)
   * - Makes creator the owner
   */
  async create(
    req: AuthenticatedRequest,
    createDto: CreateWorkspaceDto,
  ): Promise<{
    workspace: Workspace | null;
    accessToken: string;
    refreshToken: string;
    message: string;
  }> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    // 2. Check workspace limit per user
    const userWorkspaceCount = await this.countUserWorkspaces(user.id);
    const maxWorkspaces = this.getMaxWorkspacesForUser(user);

    if (userWorkspaceCount >= maxWorkspaces) {
      throw customError.forbidden(
        `Maximum workspace limit (${maxWorkspaces}) reached`,
      );
    }

    // 3. Validate slug is available
    const slugExists = await this.workspaceRepo.findOne({
      where: { slug: createDto.slug },
    });

    if (slugExists) {
      throw customError.conflict('Workspace slug already taken');
    }

    // 4. Validate slug format
    if (!this.isValidSlug(createDto.slug)) {
      throw customError.badRequest(
        'Slug must be lowercase alphanumeric with hyphens only',
      );
    }

    // 5. Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 6. Create workspace record
      const workspace = this.workspaceRepo.create({
        ...createDto,
        plan: createDto.plan || WorkspacePlan.FREE,
        ownerId: user.id,
        owner: user,
        creator: user,
        createdBy: user.id,

        isActive: true,
        settings: {
          allowInvites: true,
          requireApproval: false,
          defaultChannelAccess: 'all',
        },
      });

      await queryRunner.manager.save(workspace);

      // 7. Create workspace schema in database
      await this.createWorkspaceSchema(workspace.slug, queryRunner);

      // 8. Add creator as owner member
      await this.addOwnerMember(
        workspace.id,
        workspace.slug,
        user.id,
        queryRunner,
      );

      // 9. Create default channels
      await this.createDefaultChannels(workspace.slug, user.id, queryRunner);

      // 10. Commit transaction
      await queryRunner.commitTransaction();
      const savedWorkspace = await this.findWorkspaceWithSafeFields(
        workspace.id,
      );

      this.logger.log(
        `✅ Workspace created: ${workspace.slug} by user ${user.id}`,
      );
      const tokens = await this.tokenManager.signTokens(user, req);

      return {
        workspace: savedWorkspace,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
        message: 'Workspace created successfully',
      };
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to create workspace: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get a single workspace for a user (with membership check)
   */
  async getUserSingleWorkspace(
    workspaceId: string,
    req: AuthenticatedRequest,
  ): Promise<GetUserWorkspaceResponse> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    // Get workspace from public schema
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('No workspace with this Id was found');
    }

    if (!workspace.isActive) {
      throw customError.notFound('This workspace is not active');
    }

    // Check if user is a member of this workspace
    const sanitizedSlug = this.sanitizeSlugForSQL(workspace.slug);
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      const [member] = await this.dataSource.query(
        `SELECT 1 FROM "${schemaName}".members 
       WHERE user_id = $1 AND is_active = true 
       LIMIT 1`,
        [user.id],
      );

      if (!member) {
        throw customError.forbidden('You are not a member of this workspace');
      }
    } catch (error) {
      // If it's already a custom error, rethrow it
      if (error.statusCode) {
        throw error;
      }
      // Otherwise, schema might not exist or be accessible
      this.logger.warn(
        `Failed to check membership in schema ${schemaName}: ${error.message}`,
      );
      throw customError.forbidden('You are not a member of this workspace');
    }

    // Get workspace with safe user fields
    const workspaceWithSafeFields =
      await this.findWorkspaceWithSafeFields(workspaceId);

    if (!workspaceWithSafeFields) {
      throw customError.notFound('Workspace not found');
    }
    const tokens = await this.tokenManager.signTokens(user, req);

    return {
      workspace: workspaceWithSafeFields,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Workspace fetched successfully',
    };
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
   * Update workspace
   */
  async updateWorkspaceProperties(
    workspaceId: string,
    req: AuthenticatedRequest,
    updateDto: UpdateWorkspaceDto,
  ): Promise<UpdateWorkspaceResponse> {
    console.log(workspaceId);

    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }
    const workspace = await this.findById(workspaceId);

    // Check user is owner or admin
    const canUpdate = await this.canUserManageWorkspace(workspaceId, user.id);
    if (!canUpdate) {
      throw customError.forbidden(
        'Only workspace owners and admins can update workspace',
      );
    }

    // Update workspace
    Object.assign(workspace, updateDto);
    workspace.updatedAt = new Date();

    const savedWorkspace = await this.workspaceRepo.save(workspace);
    const workspaceWithSafeFields = await this.findWorkspaceWithSafeFields(
      savedWorkspace.id,
    );
    if (!workspaceWithSafeFields) {
      throw customError.notFound('Workspace not found');
    }
    const tokens = await this.tokenManager.signTokens(user, req);

    return {
      workspace: workspaceWithSafeFields,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
      message: 'Workspace updated successfully',
    };
  }

  /**
   * Upload and update workspace logo
   */
  async updateWorkspaceLogo(
    workspaceId: string,
    req: AuthenticatedRequest,
    file: Express.Multer.File,
  ): Promise<UpdateWorkspaceResponse> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    // Check permissions (owner/admin only)
    const canUpdate = await this.canUserManageWorkspace(workspaceId,  user.id);
    if (!canUpdate) {
      throw customError.forbidden('Insufficient permissions');
    }

    // Delete old logo if exists (parse key from URL)
    if (workspace.logoUrl) {
      try {
        const oldKey = this.storageService.parseS3Url(workspace.logoUrl);
        await this.storageService.deleteFile(oldKey, workspaceId);
      } catch (error) {
        this.logger.warn(
          `Failed to delete old logo for workspace ${workspaceId}: ${error.message}`,
        );
        // Don't fail the update if deletion fails
      }
    }

    // Upload new logo to S3
    const uploadedFile = await this.storageService.uploadFile(file, {
      workspaceId,
      userId: user.id,
      folder: 'logos',
      maxSizeInMB: 5, // 5MB max for logos
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/gif',
        'image/webp',
      ],
      makePublic: true, // Logos should be publicly accessible
    });

    // Update workspace with new logo URL
    workspace.logoUrl = uploadedFile.url;
    workspace.updatedAt = new Date();

    await this.workspaceRepo.save(workspace);

    this.logger.log(
      `Workspace logo updated: ${workspace.slug} by user ${user.id}`,
    );

    // Return workspace with safe user fields
    const updatedWorkspace= await this.findWorkspaceWithSafeFields(workspaceId);
    if (!updatedWorkspace) {
      throw customError.notFound('Workspace not found');
    }
    const tokens = await this.tokenManager.signTokens(user, req);
    return {
      workspace:updatedWorkspace,
      message:"Workspace Logo has been updated",
      accessToken:tokens.accessToken,
      refreshToken:tokens.refreshToken || '',
    }
  }
  /**
   * Soft delete workspace (deactivate)
   */
  async deactivate(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.findById(workspaceId);

    // Only owner can deactivate
    if (workspace.createdBy !== userId) {
      throw customError.forbidden(
        'Only workspace owner can deactivate workspace',
      );
    }

    workspace.isActive = false;
    workspace.updatedAt = new Date();

    await this.workspaceRepo.save(workspace);

    this.logger.log(`Workspace deactivated: ${workspace.slug}`);
  }

  /**
   * Permanently delete workspace (dangerous!)
   */
  async permanentlyDelete(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.findById(workspaceId);

    // Only owner can delete
    if (workspace.createdBy !== userId) {
      throw customError.forbidden('Only workspace owner can delete workspace');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Drop workspace schema (CASCADE removes all tables)
      await queryRunner.query(
        `DROP SCHEMA IF EXISTS workspace_${workspace.slug} CASCADE`,
      );

      // 2. Delete workspace record
      await queryRunner.manager.delete(Workspace, { id: workspaceId });

      await queryRunner.commitTransaction();

      this.logger.warn(`⚠️ Workspace PERMANENTLY deleted: ${workspace.slug}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete workspace: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update workspace plan (upgrade/downgrade)
   */
  async updatePlan(
    workspaceId: string,
    userId: string,
    newPlan: WorkspacePlan,
  ): Promise<Workspace> {
    const workspace = await this.findById(workspaceId);

    // Only owner can change plan
    if (workspace.createdBy !== userId) {
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
    const sanitizedSlug = this.sanitizeSlugForSQL(workspace.slug);
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

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Get workspace with safe user fields (excludes sensitive data)
   * @param identifier - Workspace ID or slug
   * @param bySlug - If true, searches by slug; if false, searches by ID
   * @returns Workspace with safe user fields or null if not found
   */
  public async findWorkspaceWithSafeFields(
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
  private async getMultipleWorkspacesWithSafeFields(
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
   * Create workspace schema in database
   */
  private async createWorkspaceSchema(
    slug: string,
    queryRunner: any,
  ): Promise<void> {
    const sanitizedSlug = this.sanitizeSlugForSQL(slug);
    const schemaName = `workspace_${sanitizedSlug}`;

    // Create schema
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // Members table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      role VARCHAR(50) NOT NULL,
      permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN DEFAULT true,
      joined_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_${schemaName}_members_user UNIQUE (user_id),
      CONSTRAINT chk_${schemaName}_members_permissions_array
        CHECK (jsonb_typeof(permissions) = 'array')
    )
  `);

    await queryRunner.query(`
    CREATE INDEX idx_${schemaName}_members_user_id
    ON "${schemaName}".members(user_id)
  `);

    // Channels table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_private BOOLEAN DEFAULT false,
      created_by UUID NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

    // Channel members table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".channel_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID NOT NULL
        REFERENCES "${schemaName}".channels(id) ON DELETE CASCADE,
      member_id UUID NOT NULL
        REFERENCES "${schemaName}".members(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_${schemaName}_channel_members UNIQUE (channel_id, member_id)
    )
  `);

    // Messages table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID NOT NULL
        REFERENCES "${schemaName}".channels(id) ON DELETE CASCADE,
      member_id UUID NOT NULL
        REFERENCES "${schemaName}".members(id),
      content TEXT NOT NULL,
      thread_id UUID
        REFERENCES "${schemaName}".messages(id),
      is_edited BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

    await queryRunner.query(`
    CREATE INDEX idx_${schemaName}_messages_channel
    ON "${schemaName}".messages(channel_id)
  `);

    // Files table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID NOT NULL
        REFERENCES "${schemaName}".channels(id) ON DELETE CASCADE,
      member_id UUID NOT NULL
        REFERENCES "${schemaName}".members(id),
      file_name VARCHAR(255) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100),
      storage_key VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

    // Reactions table
    await queryRunner.query(`
    CREATE TABLE "${schemaName}".reactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID NOT NULL
        REFERENCES "${schemaName}".messages(id) ON DELETE CASCADE,
      member_id UUID NOT NULL
        REFERENCES "${schemaName}".members(id),
      emoji VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_${schemaName}_reactions UNIQUE (message_id, member_id, emoji)
    )
  `);

    this.logger.log(`Schema created: ${schemaName}`);
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
   * Create default channels (#general, #random)
   */
  private async createDefaultChannels(
    slug: string,
    creatorUserId: string,
    queryRunner: any,
  ): Promise<void> {
    const sanitizedSlug = this.sanitizeSlugForSQL(slug);
    const schemaName = `workspace_${sanitizedSlug}`;

    // Get member ID
    const [member] = await queryRunner.query(
      `SELECT id FROM "${schemaName}".members WHERE user_id = $1`,
      [creatorUserId],
    );

    if (!member) {
      throw new Error(
        `Workspace member not found for user ${creatorUserId} in ${schemaName}`,
      );
    }

    // Create #general channel
    const [generalChannel] = await queryRunner.query(
      `
    INSERT INTO "${schemaName}".channels (name, description, is_private, created_by)
    VALUES ('general', 'General discussion', false, $1)
    RETURNING id
  `,
      [member.id],
    );

    // Create #random channel
    const [randomChannel] = await queryRunner.query(
      `
    INSERT INTO "${schemaName}".channels (name, description, is_private, created_by)
    VALUES ('random', 'Random chat', false, $1)
    RETURNING id
  `,
      [member.id],
    );

    // Add creator to both channels
    await queryRunner.query(
      `
    INSERT INTO "${schemaName}".channel_members (channel_id, member_id)
    VALUES ($1, $2), ($3, $2)
  `,
      [generalChannel.id, member.id, randomChannel.id],
    );

    this.logger.log(`Default channels created in ${schemaName}`);
  }

  /**
   * Count workspaces owned by user
   */
  private async countUserWorkspaces(userId: string): Promise<number> {
    return this.workspaceRepo.count({
      where: { createdBy: userId, isActive: true },
    });
  }

  /**
   * Get max workspaces allowed for user
   */
  private getMaxWorkspacesForUser(user: User): number {
    // This could be based on user's subscription
    // For now, simple logic:
    return 10; // Default limit
  }

  /**
   * Validate slug format
   */
  private isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
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

  /**
   * Validate workspace can be downgraded to free plan
   */
  private async validatePlanDowngrade(workspace: Workspace): Promise<void> {
    const stats = await this.getWorkspaceStats(workspace.id);

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
}
