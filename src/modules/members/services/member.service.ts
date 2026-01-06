
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WorkspaceMember, WorkspaceMemberEntity } from '../entities/member.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { customError } from 'src/core/error-handler/custom-errors';

@Injectable()
export class MemberService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  /**
   * Find a member in a specific workspace by user ID
   * This switches to the workspace's tenant schema to query members
   */
  async findMember(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    // First, get the workspace to know which schema to query
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    // Switch to the workspace's tenant schema
    const schemaName = `workspace_${workspace.slug}`;
    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      // Get repository for the tenant schema
      const memberRepo = this.dataSource.getRepository(WorkspaceMemberEntity);

      const member = await memberRepo.findOne({
        where: { userId, isActive: true },
      });

      return member;
    } finally {
      // Reset search path (optional, as it's request-scoped in middleware)
      await this.dataSource.query(`SET search_path TO public`);
    }
  }

  /**
   * Find member with workspace information
   * Returns member with workspace attached for convenience
   */
  async findMemberWithWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<{ member: WorkspaceMember; workspace: Workspace } | null> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return null;
    }

    const member = await this.findMember(workspaceId, userId);

    if (!member) {
      return null;
    }

    // Attach workspace to member for convenience (similar to your commented code)
    return { member, workspace };
  }

  /**
   * Get all workspaces a user is a member of
   * This requires querying all workspace schemas, which is expensive
   * Consider caching or maintaining a membership index in public schema
   */
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    // This is a simplified version - in production, you might want
    // a membership index table in the public schema for performance
    const workspaces = await this.workspaceRepo.find({
      where: { isActive: true },
    });

    const userWorkspaces: Workspace[] = [];

    for (const workspace of workspaces) {
      const member = await this.findMember(workspace.id, userId);
      if (member) {
        userWorkspaces.push(workspace);
      }
    }

    return userWorkspaces;
  }

  /**
   * Add a user as a member to a workspace
   */
  async addMember(
    workspaceId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' | 'guest' = 'member',
  ): Promise<WorkspaceMember> {
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    // Check if already a member
    const existing = await this.findMember(workspaceId, userId);
    if (existing) {
      throw customError.badRequest(
        'User is already a member of this workspace',
      );
    }

    // Switch to workspace schema
    const schemaName = `workspace_${workspace.slug}`;
    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      const memberRepo = this.dataSource.getRepository(WorkspaceMemberEntity);

      const member = memberRepo.create({
        userId,
        role,
        isActive: true,
        joinedAt: new Date(),
      });

      return await memberRepo.save(member);
    } finally {
      await this.dataSource.query(`SET search_path TO public`);
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
    const member = await this.findMember(workspaceId, userId);

    if (!member) {
      throw customError.notFound('Member not found');
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    const schemaName = `workspace_${workspace.slug}`;
    await this.dataSource.query(`SET search_path TO ${schemaName}, public`);

    try {
      const memberRepo = this.dataSource.getRepository(WorkspaceMemberEntity);
      member.role = role;
      return await memberRepo.save(member);
    } finally {
      await this.dataSource.query(`SET search_path TO public`);
    }
  }
}
