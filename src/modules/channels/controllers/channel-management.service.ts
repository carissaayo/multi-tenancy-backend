import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberService } from 'src/modules/members/services/member.service';
import { WorkspacesService } from 'src/modules/workspaces/services/workspace.service';


import { TokenManager } from 'src/core/security/services/token-manager.service';

import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import { Repository } from 'typeorm';

import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { customError } from 'src/core/error-handler/custom-errors';

@Injectable()
export class ChannelManagementService {
  private readonly logger = new Logger(ChannelManagementService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly workspacesService: WorkspacesService,
    private readonly memberService: MemberService,

    private readonly tokenManager: TokenManager,
  ) {}

  async joinChannel(req: AuthenticatedRequest, id: string) {
    const user = req.user!;
    const workspace = req.workspace!;


  }

}