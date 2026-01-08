import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WorkspaceInvitation } from "../entities/workspace_initations.entity";
import { AuthenticatedRequest } from "src/core/security/interfaces/custom-request.interface";
import { WorkspaceInviteDto } from "../dtos/workspace-invite.dto";

@Injectable()
export class WorkspaceInviteService {
    private readonly logger = new Logger(WorkspaceInviteService.name);
    constructor(
        @InjectRepository(WorkspaceInvitation) private readonly workspaceInvitationRepo: Repository<WorkspaceInvitation>,
    ){}
  async inviteByEmail(workspaceId: string, req:AuthenticatedRequest, inviteDto: WorkspaceInviteDto) {

  }

  async acceptInvite(token: string, userId: string) {}

  async revokeInvite(inviteId: string, requesterId: string) {}

  async listPendingInvites(workspaceId: string) {}
}
