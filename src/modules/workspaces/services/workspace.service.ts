import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { customError } from 'src/core/error-handler/custom-errors';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateWorkspaceDto } from '../dtos/workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly userRepo: Repository<User>,
  ) {}
  private readonly logger = new Logger(WorkspaceService.name);
  async findById(id: string): Promise<Workspace | null> {
    return this.workspaceRepo.findOne({
      where: { id, isActive: true },
    });
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.workspaceRepo.findOne({
      where: { slug, isActive: true },
    });
  }
  /**
   * Create a new workspace
   * - Creates workspace record in public schema
   * - Creates workspace schema in database
   * - Creates default channels (#general, #random)
   * - Makes creator the owner
   */
  async create(
    userId: string,
    createDto: CreateWorkspaceDto,
  ): Promise<Workspace> {
    // 1. Validate user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    // 2. Check workspace limit per user
    const userWorkspaceCount = await this.countUserWorkspaces(userId);
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
        createdBy: userId,
        plan: createDto.plan || 'free',
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
        userId,
        queryRunner,
      );

      // 9. Create default channels
      await this.createDefaultChannels(workspace.slug, userId, queryRunner);

      // 10. Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(
        `✅ Workspace created: ${workspace.slug} by user ${userId}`,
      );

      return workspace;
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

  async update(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const workspace = await this.findById(id);

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    Object.assign(workspace, updates);
    return this.workspaceRepo.save(workspace);
  }
}
