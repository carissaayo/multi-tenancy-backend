import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  WorkspaceMember,
  WorkspaceMemberEntity,
} from '../entities/member.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { customError } from 'src/core/error-handler/custom-errors';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';
import { WorkspaceInvitationRole } from 'src/modules/workspaces/interfaces/workspace.interface';
import { User } from 'src/modules/users/entities/user.entity';
import { RolePermissions } from 'src/core/security/interfaces/permission.interface';

@Injectable()
export class MemberService {
  private readonly logger = new Logger(MemberService.name);
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @Inject(forwardRef(() => WorkspacesService))
    private readonly workspacesService: WorkspacesService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Add creator as owner member
   */
  async addOwnerMember(
    workspaceId: string,
    slug: string,
    userId: string,
    queryRunner: any,
  ): Promise<void> {
    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(slug);
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
  async isUserMember(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;
    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
    try {
      // Use direct query instead of repository to ensure we're querying the correct schema
      const [member] = await this.dataSource.query(
        `SELECT * FROM "${schemaName}".members 
       WHERE user_id = $1 AND is_active = true 
       LIMIT 1`,
        [userId],
      );

      if (!member) {
        return null;
      }

      // Map the result to WorkspaceMember format
      return {
        id: member.id,
        userId: member.user_id,
        role: member.role,
        permissions: member.permissions,
        isActive: member.is_active,
        joinedAt: member.joined_at,
      } as WorkspaceMember;
    } catch (error) {
      // Log the error for debugging
      this.logger.error(
        `Error querying members in schema ${schemaName}:`,
        error,
      );
      return null;
    } finally {
      // Reset search path
      await this.dataSource.query(`SET search_path TO public`);
    }
  }

  /**
   * Add a new user to workspace
   * @param workspaceId - The workspace ID
   * @param userId - The user ID to add
   * @param role - The role to assign (defaults to 'member')
   * @returns The created workspace member
   */
  async addMemberToWorkspace(
    workspaceId: string,
    userId: string,
    role: WorkspaceInvitationRole,
  ): Promise<WorkspaceMember> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.isUserMember(workspaceId, userId);
    if (existingMember) {
      throw customError.badRequest(
        'User is already a member of this workspace',
      );
    }

    // Get permissions for the role
    const rolePermissions =
      RolePermissions[role as string] || RolePermissions.member;
    const permissions = rolePermissions.map((p) => p.toString());

    // Sanitize slug and get schema name
    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {
      // Insert member into workspace-specific schema
      const result = await this.dataSource.query(
        `
      INSERT INTO "${schemaName}".members
        (user_id, role, permissions, is_active, joined_at)
      VALUES ($1, $2, $3::jsonb, true, NOW())
      RETURNING id, user_id, role, permissions, is_active, joined_at
      `,
        [userId, role as string, JSON.stringify(permissions)],
      );

      if (!result || result.length === 0) {
        throw customError.internalServerError(
          'Failed to add member to workspace',
        );
      }

      const member = result[0];

      this.logger.log(
        `Member added: user ${userId} → workspace ${workspaceId} (${schemaName}) with role ${role}`,
      );

      // Map the result to WorkspaceMember format
      return {
        id: member.id,
        userId: member.user_id,
        role: member.role,
        permissions: member.permissions,
        isActive: member.is_active,
        joinedAt: member.joined_at,
      } as WorkspaceMember;
    } catch (error) {
      this.logger.error(
        `Error adding member to workspace ${workspaceId}: ${error.message}`,
      );

      // Handle unique constraint violation (user already exists)
      if (error.code === '23505') {
        throw customError.badRequest(
          'User is already a member of this workspace',
        );
      }

      // Handle schema not found
      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      throw customError.internalServerError(
        'Failed to add member to workspace',
      );
    }
  }
  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' | 'guest',
  ): Promise<WorkspaceMember> {
    const member = await this.isUserMember(workspaceId, userId);

    if (!member) {
      throw customError.notFound('Member not found');
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;
    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      const memberRepo = this.dataSource.getRepository(WorkspaceMemberEntity);
      member.role = role;
      return await memberRepo.save(member);
    } finally {
      await this.dataSource.query(`SET search_path TO public`);
    }
  }

  /**
   * Remove a member from a workspace 
   * @param workspaceId - The workspace ID
   * @param userId - The user ID to remove
   */
  async removeMemberFromWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }



    const member = await this.isUserMember(workspaceId, userId);
    if (!member) {
      throw customError.notFound('Member not found');
    }

    // Sanitize slug and get schema name
    const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(
      workspace.slug,
    );
    const schemaName = `workspace_${sanitizedSlug}`;

    try {

      const result = await this.dataSource.query(
        `
      DELETE FROM "${schemaName}".members
      WHERE user_id = $1
      RETURNING id, user_id, role
      `,
        [userId],
      );

      if (!result || result.length === 0) {
        throw customError.internalServerError(
          'Failed to remove member from workspace',
        );
      }

      this.logger.log(
        `Member removed: user ${userId} from workspace ${workspaceId} (${schemaName})`,
      );
    } catch (error) {
      this.logger.error(
        `Error removing member from workspace ${workspaceId}: ${error.message}`,
      );

      // Handle schema not found
      if (error.message?.includes('does not exist')) {
        throw customError.internalServerError('Workspace schema not found');
      }

      throw customError.internalServerError(
        'Failed to remove member from workspace',
      );
    }
  }
  /**
   * Get member with safe fields only
   * Returns only public/safe member information
   */
  getMemberProfile(member: WorkspaceMember): Partial<WorkspaceMember> {
    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      isActive: member.isActive,
      joinedAt: member.joinedAt,
    };
  }
}
