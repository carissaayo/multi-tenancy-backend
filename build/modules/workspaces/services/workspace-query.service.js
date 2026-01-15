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
var WorkspaceQueryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceQueryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const workspace_entity_1 = require("../entities/workspace.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
let WorkspaceQueryService = WorkspaceQueryService_1 = class WorkspaceQueryService {
    workspaceRepo;
    userRepo;
    dataSource;
    tokenManager;
    logger = new common_1.Logger(WorkspaceQueryService_1.name);
    constructor(workspaceRepo, userRepo, dataSource, tokenManager) {
        this.workspaceRepo = workspaceRepo;
        this.userRepo = userRepo;
        this.dataSource = dataSource;
        this.tokenManager = tokenManager;
    }
    async findById(id) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id },
            relations: ['creator'],
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        return workspace;
    }
    async findBySlug(slug) {
        return this.workspaceRepo.findOne({
            where: { slug },
            relations: ['creator'],
        });
    }
    async getUserWorkspaces(req) {
        const user = await this.userRepo.findOne({ where: { id: req.userId } });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        const workspaceSchemas = await this.dataSource.query(`
    SELECT DISTINCT table_schema as schema_name
    FROM information_schema.tables 
    WHERE table_name = 'members' 
    AND table_schema LIKE 'workspace_%'
    `);
        const workspaceSlugs = [];
        for (const row of workspaceSchemas) {
            const schemaName = row.schema_name;
            try {
                const [member] = await this.dataSource.query(`SELECT 1 FROM "${schemaName}".members 
         WHERE user_id = $1 AND is_active = true 
         LIMIT 1`, [user.id]);
                if (member) {
                    const slugFromSchema = schemaName
                        .replace('workspace_', '')
                        .replace(/_/g, '-');
                    workspaceSlugs.push(slugFromSchema);
                }
            }
            catch (error) {
                this.logger.warn(`Failed to check membership in schema ${schemaName}: ${error.message}`);
            }
        }
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
        const workspaces = await this.getMultipleWorkspacesWithSafeFields(workspaceSlugs, true);
        const tokens = await this.tokenManager.signTokens(user, req);
        return {
            workspaces: workspaces,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken || '',
            message: 'Workspaces fetched successfully',
            totalWorkspacesCount: workspaces.length,
        };
    }
    async findWorkspaceWithSafeFields(identifier, bySlug = false) {
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
    async getMultipleWorkspacesWithSafeFields(identifiers, bySlug = false) {
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
    async isValidSlug(slug) {
        const slugRegex = /^[a-z0-9-]+$/;
        return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
    }
    sanitizeSlugForSQL(slug) {
        return slug.replace(/-/g, '_');
    }
    async getWorkspaceStats(workspaceId) {
        const workspace = await this.findById(workspaceId);
        const sanitizedSlug = this.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        const [memberCount] = await this.dataSource.query(`SELECT COUNT(*) as count FROM "${schemaName}".members WHERE is_active = true`);
        const [channelCount] = await this.dataSource.query(`SELECT COUNT(*) as count FROM "${schemaName}".channels`);
        const [messageCount] = await this.dataSource.query(`SELECT COUNT(*) as count FROM "${schemaName}".messages`);
        const [fileStats] = await this.dataSource.query(`SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size 
       FROM "${schemaName}".files`);
        return {
            memberCount: parseInt(memberCount.count),
            channelCount: parseInt(channelCount.count),
            messageCount: parseInt(messageCount.count),
            fileCount: parseInt(fileStats.count),
            storageUsed: parseInt(fileStats.total_size) / (1024 * 1024),
        };
    }
};
exports.WorkspaceQueryService = WorkspaceQueryService;
exports.WorkspaceQueryService = WorkspaceQueryService = WorkspaceQueryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        token_manager_service_1.TokenManager])
], WorkspaceQueryService);
//# sourceMappingURL=workspace-query.service.js.map