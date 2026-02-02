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
var WorkspaceMembershipService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceMembershipService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workspace_query_service_1 = require("./workspace-query.service");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
const workspace_entity_1 = require("../entities/workspace.entity");
const member_service_1 = require("../../members/services/member.service");
const user_entity_1 = require("../../users/entities/user.entity");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const workspace_interface_1 = require("../interfaces/workspace.interface");
let WorkspaceMembershipService = WorkspaceMembershipService_1 = class WorkspaceMembershipService {
    workspaceRepo;
    userRepo;
    dataSource;
    workspaceQueryService;
    memberService;
    tokenManager;
    logger = new common_1.Logger(WorkspaceMembershipService_1.name);
    constructor(workspaceRepo, userRepo, dataSource, workspaceQueryService, memberService, tokenManager) {
        this.workspaceRepo = workspaceRepo;
        this.userRepo = userRepo;
        this.dataSource = dataSource;
        this.workspaceQueryService = workspaceQueryService;
        this.memberService = memberService;
        this.tokenManager = tokenManager;
    }
    async canUserManageWorkspace(workspaceId, userId) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace)
            return false;
        if (workspace.createdBy === userId)
            return true;
        const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const [result] = await this.dataSource.query(`SELECT role FROM "${schemaName}".members 
         WHERE user_id = $1 AND is_active = true 
         LIMIT 1`, [userId]);
            return result && (result.role === 'admin' || result.role === 'owner');
        }
        catch (error) {
            return false;
        }
    }
    async countUserWorkspaces(userId) {
        return this.workspaceRepo.count({
            where: { createdBy: userId, isActive: true },
        });
    }
    async getUserSingleWorkspace(workspaceId, req) {
        const user = await this.userRepo.findOne({ where: { id: req.userId } });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('No workspace with this Id was found');
        }
        if (!workspace.isActive) {
            throw custom_errors_1.customError.notFound('This workspace is not active');
        }
        const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const [member] = await this.dataSource.query(`SELECT 1 FROM "${schemaName}".members 
       WHERE user_id = $1 AND is_active = true 
       LIMIT 1`, [user.id]);
            if (!member) {
                throw custom_errors_1.customError.forbidden('You are not a member of this workspace');
            }
        }
        catch (error) {
            if (error.statusCode) {
                throw error;
            }
            this.logger.warn(`Failed to check membership in schema ${schemaName}: ${error.message}`);
            throw custom_errors_1.customError.forbidden('You are not a member of this workspace');
        }
        const workspaceWithSafeFields = await this.workspaceQueryService.findWorkspaceWithSafeFields(workspaceId);
        if (!workspaceWithSafeFields) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            workspace: workspaceWithSafeFields,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Workspace fetched successfully',
        };
    }
    async countUserFreeWorkspaces(userId) {
        return this.workspaceRepo.count({
            where: {
                createdBy: userId,
                isActive: true,
                plan: workspace_interface_1.WorkspacePlan.FREE,
            },
        });
    }
    getMaxWorkspacesForUser(user) {
        return 10;
    }
    getMemberProfile(member) {
        return this.memberService.getMemberProfile(member);
    }
    async getWorkspaceMembers(workspaceId, userId, options) {
        const member = await this.memberService.isUserMember(workspaceId, userId);
        if (!member) {
            throw custom_errors_1.customError.forbidden('You are not a member of this workspace');
        }
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const sanitizedSlug = this.workspaceQueryService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            let query = `
      SELECT 
        m.id as member_id,
        m.user_id,
        m.role,
        m.permissions,
        m.is_active as member_is_active,
        m.joined_at as workspace_joined_at,
        u.id as user_id,
        u.email,
        u.full_name,
        u.avatar_url,
        u.is_email_verified
      FROM "${schemaName}".members m
      INNER JOIN public.users u ON m.user_id = u.id
      WHERE 1=1
    `;
            const params = [];
            let paramIndex = 1;
            if (options?.isActive !== undefined) {
                query += ` AND m.is_active = $${paramIndex}`;
                params.push(options.isActive);
                paramIndex++;
            }
            if (options?.role) {
                query += ` AND m.role = $${paramIndex}`;
                params.push(options.role);
                paramIndex++;
            }
            query += ` ORDER BY m.joined_at ASC`;
            if (options?.limit) {
                query += ` LIMIT $${paramIndex}`;
                params.push(options.limit);
                paramIndex++;
            }
            if (options?.offset) {
                query += ` OFFSET $${paramIndex}`;
                params.push(options.offset);
                paramIndex++;
            }
            const result = await this.dataSource.query(query, params);
            let countQuery = `
      SELECT COUNT(*) as total
      FROM "${schemaName}".members m
      WHERE 1=1
    `;
            const countParams = [];
            let countParamIndex = 1;
            if (options?.isActive !== undefined) {
                countQuery += ` AND m.is_active = $${countParamIndex}`;
                countParams.push(options.isActive);
                countParamIndex++;
            }
            if (options?.role) {
                countQuery += ` AND m.role = $${countParamIndex}`;
                countParams.push(options.role);
                countParamIndex++;
            }
            const [countResult] = await this.dataSource.query(countQuery, countParams);
            const total = parseInt(countResult.total);
            const members = result.map((row) => ({
                member: {
                    id: row.member_id,
                    userId: row.user_id,
                    role: row.role,
                    isActive: row.member_is_active,
                    joinedAt: row.workspace_joined_at,
                },
                user: {
                    id: row.user_id,
                    email: row.email,
                    fullName: row.full_name,
                    avatarUrl: row.avatar_url,
                    isEmailVerified: row.is_email_verified,
                },
            }));
            return {
                members,
                total,
            };
        }
        catch (error) {
            this.logger.error(`Error finding workspace members for workspace ${workspaceId}: ${error.message}`);
            if (error.statusCode) {
                throw error;
            }
            if (error.message?.includes('does not exist')) {
                throw custom_errors_1.customError.internalServerError('Workspace schema not found');
            }
            throw custom_errors_1.customError.internalServerError('Failed to fetch workspace members');
        }
    }
};
exports.WorkspaceMembershipService = WorkspaceMembershipService;
exports.WorkspaceMembershipService = WorkspaceMembershipService = WorkspaceMembershipService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => member_service_1.MemberService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        workspace_query_service_1.WorkspaceQueryService,
        member_service_1.MemberService,
        token_manager_service_1.TokenManager])
], WorkspaceMembershipService);
//# sourceMappingURL=workspace-membership.service.js.map