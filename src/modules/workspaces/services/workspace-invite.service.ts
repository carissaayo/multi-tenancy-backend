import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceInvitation } from '../entities/workspace_initations.entity';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { WorkspaceInviteDto } from '../dtos/workspace-invite.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { customError } from 'src/core/error-handler/custom-errors';
import { Workspace } from '../entities/workspace.entity';
import { MemberService } from 'src/modules/members/services/member.service';
import { PermissionsEnum } from 'src/core/security/interfaces/permission.interface';

@Injectable()
export class WorkspaceInviteService {
  private readonly logger = new Logger(WorkspaceInviteService.name);
  constructor(
    @InjectRepository(WorkspaceInvitation)
    private readonly workspaceInvitationRepo: Repository<WorkspaceInvitation>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly memberService: MemberService,
  ) {}
  async inviteByEmail(
    workspaceId: string,
    req: AuthenticatedRequest,
    inviteDto: WorkspaceInviteDto,
  ) {
    const { email } = inviteDto;
    const user = await this.userRepo.findOne({ where: { id: req.userId } });

    if (!user) {
      throw customError.notFound('User not found');
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('No workspace found with this id');
    }

    const canInvite = await this.hasInvitePermission(workspaceId, req.userId);

    if (!canInvite) {
      throw customError.forbidden(
        'You do not have permission to invite members to this workspace. Only admins and owners can invite members.',
      );
    }
    const existingInvitation = await this.workspaceInvitationRepo.findOne({
      where: {
        workspaceId,
        email,
      },
    });
    if (existingInvitation) {
      throw customError.badRequest(
        'This email is already invited to this workspace',
      );
    }
  }

  async acceptInvite(token: string, userId: string) {}

  async revokeInvite(inviteId: string, requesterId: string) {}

  async listPendingInvites(workspaceId: string) {}

  /**
   * Check if user has permission to invite members
   */
  private async hasInvitePermission(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    const member = await this.memberService.findMember(workspaceId, userId);

    if (!member || !member.isActive) {
      return false;
    }

    // Check if user has MEMBER_INVITE permission
    const hasPermission = member.permissions?.includes(
      PermissionsEnum.MEMBER_INVITE,
    );

    // Also check if user is owner or admin (they should have invite permission)
    const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';

    return hasPermission || isOwnerOrAdmin;
  }
}
