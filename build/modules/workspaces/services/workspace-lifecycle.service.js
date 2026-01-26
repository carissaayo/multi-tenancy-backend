"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WorkspaceLifecycleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceLifecycleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const typeorm_2 = require("typeorm");
const workspace_entity_1 = require("../entities/workspace.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const workspace_interface_1 = require("../interfaces/workspace.interface");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
const workspace_membership_service_1 = require("./workspace-membership.service");
const workspace_query_service_1 = require("./workspace-query.service");
const aws_storage_service_1 = require("../../../core/storage/services/aws-storage.service");
const member_service_1 = require("../../members/services/member.service");
let WorkspaceLifecycleService = WorkspaceLifecycleService_1 = class WorkspaceLifecycleService {
    workspaceRepo;
    userRepo;
    dataSource;
    tokenManager;
    workspaceMembershipService;
    workspaceQueryService;
    memberService;
    storageService;
    configService;
    logger = new common_1.Logger(WorkspaceLifecycleService_1.name);
    constructor(workspaceRepo, userRepo, dataSource, tokenManager, workspaceMembershipService, workspaceQueryService, memberService, storageService, configService) {
        this.workspaceRepo = workspaceRepo;
        this.userRepo = userRepo;
        this.dataSource = dataSource;
        this.tokenManager = tokenManager;
        this.workspaceMembershipService = workspaceMembershipService;
        this.workspaceQueryService = workspaceQueryService;
        this.memberService = memberService;
        this.storageService = storageService;
        this.configService = configService;
    }
    async create(req, createDto) {
        const user = req.user;
        const workspacePlan = createDto.plan || workspace_interface_1.WorkspacePlan.FREE;
        const MAX_FREE_WORKSPACES = this.configService.get('workspace.maxFreeWorkspaces') || 2;
        if (workspacePlan === workspace_interface_1.WorkspacePlan.FREE) {
            const freeWorkspaceCount = await this.workspaceMembershipService.countUserFreeWorkspaces(user.id);
            if (freeWorkspaceCount >= MAX_FREE_WORKSPACES) {
                throw custom_errors_1.customError.forbidden(`You have reached the maximum limit of ${MAX_FREE_WORKSPACES} free workspaces. Please upgrade to a paid plan to create more workspaces.`);
            }
        }
        const userWorkspaceCount = await this.workspaceMembershipService.countUserWorkspaces(user.id);
        const maxWorkspaces = this.workspaceMembershipService.getMaxWorkspacesForUser(user);
        if (userWorkspaceCount >= maxWorkspaces) {
            throw custom_errors_1.customError.forbidden(`Maximum workspace limit (${maxWorkspaces}) reached`);
        }
        const slugExists = await this.workspaceRepo.findOne({
            where: { slug: createDto.slug },
        });
        if (slugExists) {
            throw custom_errors_1.customError.conflict('Workspace slug already taken');
        }
        if (!this.workspaceQueryService.isValidSlug(createDto.slug)) {
            throw custom_errors_1.customError.badRequest('Slug must be lowercase alphanumeric with hyphens only');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const workspace = this.workspaceRepo.create({
                ...createDto,
                plan: createDto.plan || workspace_interface_1.WorkspacePlan.FREE,
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
            await this.createWorkspaceSchema(workspace.slug, queryRunner);
            await this.memberService.addOwnerMember(workspace.id, workspace.slug, user.id, queryRunner);
            await this.createDefaultChannels(workspace.slug, user.id, queryRunner);
            await queryRunner.commitTransaction();
            const savedWorkspace = await this.workspaceQueryService.findWorkspaceWithSafeFields(workspace.id);
            this.logger.log(`✅ Workspace created: ${workspace.slug} by user ${user.id}`);
            const tokens = await this.tokenManager.signTokens(user, req);
            return {
                workspace: savedWorkspace,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken || '',
                message: 'Workspace created successfully',
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to create workspace: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateWorkspaceProperties(workspaceId, req, updateDto) {
        console.log(workspaceId);
        const user = req.user;
        const workspace = req.workspace;
        const canUpdate = await this.workspaceMembershipService.canUserManageWorkspace(workspace.id, user.id);
        if (!canUpdate) {
            throw custom_errors_1.customError.forbidden('Only workspace owners and admins can update workspace');
        }
        Object.assign(workspace, updateDto);
        workspace.updatedAt = new Date();
        const savedWorkspace = await this.workspaceRepo.save(workspace);
        const workspaceWithSafeFields = await this.workspaceQueryService.findWorkspaceWithSafeFields(savedWorkspace.id);
        if (!workspaceWithSafeFields) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            workspace: workspaceWithSafeFields,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Workspace updated successfully',
        };
    }
    async updateWorkspaceLogo(workspaceId, req, file) {
        const user = req.user;
        const workspace = req.workspace;
        const canUpdate = await this.workspaceMembershipService.canUserManageWorkspace(workspace.id, user.id);
        if (!canUpdate) {
            throw custom_errors_1.customError.forbidden('Only workspace owners and admins can update workspace');
        }
        if (workspace.logoUrl) {
            try {
                const oldKey = this.storageService.parseS3Url(workspace.logoUrl);
                await this.storageService.deleteFile(oldKey, workspaceId);
            }
            catch (error) {
                this.logger.warn(`Failed to delete old logo for workspace ${workspaceId}: ${error.message}`);
            }
        }
        const uploadedFile = await this.storageService.uploadFile(file, {
            workspaceId,
            userId: user.id,
            folder: 'logos',
            maxSizeInMB: 5,
            allowedMimeTypes: [
                'image/jpeg',
                'image/png',
                'image/jpg',
                'image/gif',
                'image/webp',
            ],
            makePublic: true,
        });
        workspace.logoUrl = uploadedFile.url;
        workspace.updatedAt = new Date();
        await this.workspaceRepo.save(workspace);
        this.logger.log(`Workspace logo updated: ${workspace.slug} by user ${user.id}`);
        const updatedWorkspace = await this.workspaceQueryService.findWorkspaceWithSafeFields(workspaceId);
        if (!updatedWorkspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            workspace: updatedWorkspace,
            message: 'Workspace Logo has been updated',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
        };
    }
    async deactivate(req) {
        const user = req.user;
        const workspace = req.workspace;
        if (workspace.createdBy !== user.id) {
            throw custom_errors_1.customError.forbidden('Only workspace owner can deactivate workspace');
        }
        workspace.isActive = false;
        workspace.updatedAt = new Date();
        await this.workspaceRepo.save(workspace);
        this.logger.log(`Workspace deactivated: ${workspace.slug}`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Workspace deactivated successfully',
        };
    }
    async activate(req) {
        const user = req.user;
        const workspace = req.workspace;
        if (workspace.createdBy !== user.id) {
            throw custom_errors_1.customError.forbidden('Only workspace owner can activate workspace');
        }
        workspace.isActive = true;
        workspace.updatedAt = new Date();
        await this.workspaceRepo.save(workspace);
        this.logger.log(`Workspace activated: ${workspace.slug}`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Workspace activated successfully',
        };
    }
    async delete(req) {
        const user = req.user;
        const workspace = req.workspace;
        if (workspace.createdBy !== user.id) {
            throw custom_errors_1.customError.forbidden('Only workspace owner can delete workspace');
        }
        await this.workspaceRepo.softDelete(workspace.id);
        this.logger.warn(`Workspace soft-deleted: ${workspace.slug}`);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Workspace deleted successfully',
        };
    }
    async createWorkspaceSchema(slug, queryRunner) {
        const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".members (
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
    CREATE INDEX IF NOT EXISTS idx_${schemaName}_members_user_id
    ON "${schemaName}".members(user_id)
  `);
        await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_private BOOLEAN DEFAULT false,
      created_by UUID NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
        await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".channel_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID NOT NULL
        REFERENCES "${schemaName}".channels(id) ON DELETE CASCADE,
      member_id UUID NOT NULL
        REFERENCES "${schemaName}".members(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT uq_${schemaName}_channel_members UNIQUE (channel_id, member_id)
    )
  `);
        await queryRunner.query(`
  CREATE TABLE IF NOT EXISTS "${schemaName}".messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL
      REFERENCES "${schemaName}".channels(id) ON DELETE CASCADE,
    member_id UUID NOT NULL
      REFERENCES "${schemaName}".members(id),
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text',
    thread_id UUID
      REFERENCES "${schemaName}".messages(id),
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
  )
`);
        await queryRunner.query(`
  CREATE INDEX IF NOT EXISTS idx_${schemaName}_messages_channel_created
  ON "${schemaName}".messages(channel_id, created_at)
`);
        await queryRunner.query(`
  CREATE INDEX IF NOT EXISTS idx_${schemaName}_messages_thread
  ON "${schemaName}".messages(thread_id)
`);
        await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".files (
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
        await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".reactions (
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
    async createDefaultChannels(slug, creatorUserId, queryRunner) {
        const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        const [member] = await queryRunner.query(`SELECT id FROM "${schemaName}".members WHERE user_id = $1`, [creatorUserId]);
        if (!member) {
            throw new Error(`Workspace member not found for user ${creatorUserId} in ${schemaName}`);
        }
        const [generalChannel] = await queryRunner.query(`
    INSERT INTO "${schemaName}".channels (name, description, is_private, created_by)
    VALUES ('general', 'General discussion', false, $1)
    RETURNING id
  `, [member.id]);
        const [randomChannel] = await queryRunner.query(`
    INSERT INTO "${schemaName}".channels (name, description, is_private, created_by)
    VALUES ('random', 'Random chat', false, $1)
    RETURNING id
  `, [member.id]);
        await queryRunner.query(`
    INSERT INTO "${schemaName}".channel_members (channel_id, member_id)
    VALUES ($1, $2), ($3, $2)
  `, [generalChannel.id, member.id, randomChannel.id]);
        this.logger.log(`Default channels created in ${schemaName}`);
    }
};
exports.WorkspaceLifecycleService = WorkspaceLifecycleService;
exports.WorkspaceLifecycleService = WorkspaceLifecycleService = WorkspaceLifecycleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => member_service_1.MemberService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        token_manager_service_1.TokenManager,
        workspace_membership_service_1.WorkspaceMembershipService,
        workspace_query_service_1.WorkspaceQueryService,
        member_service_1.MemberService,
        aws_storage_service_1.AWSStorageService,
        config_1.ConfigService])
], WorkspaceLifecycleService);
//# sourceMappingURL=workspace-lifecycle.service.js.map