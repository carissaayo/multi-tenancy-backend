import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

import { WorkspaceInvitation } from '../entities/workspace_initations.entity';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { WorkspaceInviteDto } from '../dtos/workspace-invite.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { customError } from 'src/core/error-handler/custom-errors';
import { Workspace } from '../entities/workspace.entity';
import { MemberService } from 'src/modules/members/services/member.service';
import { PermissionsEnum } from 'src/core/security/interfaces/permission.interface';
import { EmailService } from 'src/core/email/services/email.service';
import { TokenManager } from 'src/core/security/services/token-manager.service';

@Injectable()
export class WorkspaceInviteService {
  private readonly logger = new Logger(WorkspaceInviteService.name);
  private readonly INIVTE_EXPIRY_DAYS = 1;
  constructor(
    @InjectRepository(WorkspaceInvitation)
    private readonly workspaceInvitationRepo: Repository<WorkspaceInvitation>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @Inject(forwardRef(() => MemberService))
    private readonly memberService: MemberService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly tokenManager: TokenManager,
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
    if (email === user.email) {
      throw customError.badRequest('You cannot invite yourself');
    }
    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw customError.notFound('No workspace found with this id');
    }

    const canInvite = await this.hasInvitePermission(
      workspaceId,
      req.userId,
      workspace,
    );

    if (!canInvite) {
      throw customError.forbidden(
        'You do not have permission to invite members to this workspace. Only admins and owners can invite members.',
      );
    }

    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (!existingUser) {
      throw customError.badRequest('No existing found with this email');
    }

    const member = await this.memberService.findMember(
      workspaceId,
      existingUser.id,
    );
    if (member) {
      throw customError.badRequest(
        'This user is already a member of this workspace',
      );
    }
    const existingInvitation = await this.workspaceInvitationRepo.findOne({
      where: {
        workspaceId,
        email,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (existingInvitation) {
      throw customError.badRequest(
        'This email is already invited to this workspace',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * this.INIVTE_EXPIRY_DAYS,
    );
    const invitation = this.workspaceInvitationRepo.create({
      workspaceId,
      email,
      invitedBy: req.userId,
      expiresAt,
      token,
    });
    await this.workspaceInvitationRepo.save(invitation);

    const frontendUrl =
      this.configService.get<string>('frontend.url') || 'http://localhost:8000';
    const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;

    const inviterName = user.fullName || user.email;

    await this.emailService.sendWorkspaceInvitation(
      email,
      workspace.name,
      inviterName,
      inviteLink,
      expiresAt.toISOString(),
    );

    this.logger.log(
      `Invitation sent to ${email} for workspace ${workspace.name}`,
    );

    const tokens = await this.tokenManager.signTokens(user, req);

    return {
      message: 'Invitation sent successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || '',
    };
  }

  async acceptInvite(token: string, userId: string) {}

  async revokeInvite(inviteId: string, requesterId: string) {}

  async listPendingInvites(workspaceId: string) {}

  /**
   * Check if user has permission to invite members
   * User must be either:
   * 1. The workspace owner, OR
   * 2. A member with MEMBER_INVITE permission (admin/owner role)
   */
  private async hasInvitePermission(
    workspaceId: string,
    userId: string,
    workspace: Workspace,
  ): Promise<boolean> {
    // Check if user is the workspace owner
    if (workspace.createdBy === userId || workspace.ownerId === userId) {
      this.logger.debug(
        `User ${userId} is the owner of workspace ${workspaceId}`,
      );
      return true;
    }

    // Check if user is a member of the workspace
    const member = await this.memberService.findMember(workspaceId, userId);

    if (!member || !member.isActive) {
      this.logger.warn(
        `User ${userId} is not a member of workspace ${workspaceId}`,
      );
      return false;
    }

    // Check if user has MEMBER_INVITE permission
    const hasPermission = member.permissions?.includes(
      PermissionsEnum.MEMBER_INVITE,
    );

    // Also check if user is owner or admin (they should have invite permission)
    const isOwnerOrAdmin = member.role === 'owner' || member.role === 'admin';

    const canInvite = hasPermission || isOwnerOrAdmin;

    if (!canInvite) {
      this.logger.warn(
        `User ${userId} does not have invite permission in workspace ${workspaceId}`,
      );
    }

    return canInvite;
  }
}
