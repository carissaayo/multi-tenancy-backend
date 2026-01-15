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
var MemberService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const member_entity_1 = require("../entities/member.entity");
const workspace_entity_1 = require("../../workspaces/entities/workspace.entity");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const workspace_service_1 = require("../../workspaces/services/workspace.service");
const user_entity_1 = require("../../users/entities/user.entity");
const permission_interface_1 = require("../../../core/security/interfaces/permission.interface");
let MemberService = MemberService_1 = class MemberService {
    dataSource;
    workspaceRepo;
    workspacesService;
    userRepo;
    logger = new common_1.Logger(MemberService_1.name);
    constructor(dataSource, workspaceRepo, workspacesService, userRepo) {
        this.dataSource = dataSource;
        this.workspaceRepo = workspaceRepo;
        this.workspacesService = workspacesService;
        this.userRepo = userRepo;
    }
    async addOwnerMember(workspaceId, slug, userId, queryRunner) {
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        const ownerPermissions = permission_interface_1.RolePermissions.owner.map((p) => p.toString());
        await queryRunner.query(`
    INSERT INTO "${schemaName}".members
      (user_id, role, permissions, is_active, joined_at)
    VALUES ($1, 'owner', $2::jsonb, true, NOW())
    `, [userId, JSON.stringify(ownerPermissions)]);
        this.logger.log(`Owner member added: user ${userId} → workspace ${workspaceId} (${schemaName})`);
    }
    async isUserMember(workspaceId, userId) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
        try {
            const [member] = await this.dataSource.query(`SELECT * FROM "${schemaName}".members 
       WHERE user_id = $1 AND is_active = true 
       LIMIT 1`, [userId]);
            if (!member) {
                return null;
            }
            return {
                id: member.id,
                userId: member.user_id,
                role: member.role,
                permissions: member.permissions,
                isActive: member.is_active,
                joinedAt: member.joined_at,
            };
        }
        catch (error) {
            this.logger.error(`Error querying members in schema ${schemaName}:`, error);
            return null;
        }
        finally {
            await this.dataSource.query(`SET search_path TO public`);
        }
    }
    async addMemberToWorkspace(workspaceId, userId, role) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        const existingMember = await this.isUserMember(workspaceId, userId);
        if (existingMember) {
            throw custom_errors_1.customError.badRequest('User is already a member of this workspace');
        }
        const rolePermissions = permission_interface_1.RolePermissions[role] || permission_interface_1.RolePermissions.member;
        const permissions = rolePermissions.map((p) => p.toString());
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const result = await this.dataSource.query(`
      INSERT INTO "${schemaName}".members
        (user_id, role, permissions, is_active, joined_at)
      VALUES ($1, $2, $3::jsonb, true, NOW())
      RETURNING id, user_id, role, permissions, is_active, joined_at
      `, [userId, role, JSON.stringify(permissions)]);
            if (!result || result.length === 0) {
                throw custom_errors_1.customError.internalServerError('Failed to add member to workspace');
            }
            const member = result[0];
            this.logger.log(`Member added: user ${userId} → workspace ${workspaceId} (${schemaName}) with role ${role}`);
            return {
                id: member.id,
                userId: member.user_id,
                role: member.role,
                permissions: member.permissions,
                isActive: member.is_active,
                joinedAt: member.joined_at,
            };
        }
        catch (error) {
            this.logger.error(`Error adding member to workspace ${workspaceId}: ${error.message}`);
            if (error.code === '23505') {
                throw custom_errors_1.customError.badRequest('User is already a member of this workspace');
            }
            if (error.message?.includes('does not exist')) {
                throw custom_errors_1.customError.internalServerError('Workspace schema not found');
            }
            throw custom_errors_1.customError.internalServerError('Failed to add member to workspace');
        }
    }
    async updateMemberRole(workspaceId, userId, role) {
        const member = await this.isUserMember(workspaceId, userId);
        if (!member) {
            throw custom_errors_1.customError.notFound('Member not found');
        }
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        await this.dataSource.query(`SET search_path TO ${schemaName}, public`);
        try {
            const memberRepo = this.dataSource.getRepository(member_entity_1.WorkspaceMemberEntity);
            member.role = role;
            return await memberRepo.save(member);
        }
        finally {
            await this.dataSource.query(`SET search_path TO public`);
        }
    }
    async removeMemberFromWorkspace(workspaceId, userId) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const member = await this.isUserMember(workspaceId, userId);
        if (!member) {
            throw custom_errors_1.customError.notFound('Member not found');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const result = await this.dataSource.query(`
      DELETE FROM "${schemaName}".members
      WHERE user_id = $1
      RETURNING id, user_id, role
      `, [userId]);
            if (!result || result.length === 0) {
                throw custom_errors_1.customError.internalServerError('Failed to remove member from workspace');
            }
            this.logger.log(`Member removed: user ${userId} from workspace ${workspaceId} (${schemaName})`);
        }
        catch (error) {
            this.logger.error(`Error removing member from workspace ${workspaceId}: ${error.message}`);
            if (error.message?.includes('does not exist')) {
                throw custom_errors_1.customError.internalServerError('Workspace schema not found');
            }
            throw custom_errors_1.customError.internalServerError('Failed to remove member from workspace');
        }
    }
    async deactivateMember(workspaceId, userId) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const member = await this.isUserMember(workspaceId, userId);
        if (!member) {
            throw custom_errors_1.customError.notFound('Member not found');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        try {
            const result = await this.dataSource.query(`
      UPDATE FROM "${schemaName}".members
      WHERE user_id = $1
      SET is_active = false
      `, [userId]);
            if (!result || result.length === 0) {
                throw custom_errors_1.customError.internalServerError('Failed to deactivate member from workspace');
            }
            this.logger.log(`Member deactivated: user ${userId} from workspace ${workspaceId} (${schemaName})`);
        }
        catch (error) {
            this.logger.error(`Error deactivating member from workspace ${workspaceId}: ${error.message}`);
            if (error.message?.includes('does not exist')) {
                throw custom_errors_1.customError.internalServerError('Workspace schema not found');
            }
            throw custom_errors_1.customError.internalServerError('Failed to deactivate member from workspace');
        }
    }
    async transferOwnership(workspaceId, previousOwnerId, newOwnerId) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw custom_errors_1.customError.notFound('Workspace not found');
        }
        const newOwnerMember = await this.isUserMember(workspaceId, newOwnerId);
        if (!newOwnerMember) {
            throw custom_errors_1.customError.notFound('Intended new owner is not a member of this workspace');
        }
        const sanitizedSlug = this.workspacesService.sanitizeSlugForSQL(workspace.slug);
        const schemaName = `workspace_${sanitizedSlug}`;
        const adminPermissions = permission_interface_1.RolePermissions.admin.map((p) => p.toString());
        const ownerPermissions = permission_interface_1.RolePermissions.owner.map((p) => p.toString());
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const newOwnerResult = await queryRunner.query(`
        UPDATE "${schemaName}".members
        SET role = $1, permissions = $2::jsonb
        WHERE user_id = $3
        RETURNING id, user_id, role
        `, ['owner', JSON.stringify(ownerPermissions), newOwnerId]);
            if (!newOwnerResult || newOwnerResult.length === 0) {
                throw custom_errors_1.customError.internalServerError('Failed to transfer ownership: new owner role update failed');
            }
            const previousOwnerMember = await this.isUserMember(workspaceId, previousOwnerId);
            if (previousOwnerMember) {
                const previousOwnerResult = await queryRunner.query(`
          UPDATE "${schemaName}".members
          SET role = $1, permissions = $2::jsonb
          WHERE user_id = $3
          RETURNING id, user_id, role
          `, ['admin', JSON.stringify(adminPermissions), previousOwnerId]);
                if (!previousOwnerResult || previousOwnerResult.length === 0) {
                    throw custom_errors_1.customError.internalServerError('Failed to transfer ownership: previous owner role update failed');
                }
            }
            await queryRunner.commitTransaction();
            this.logger.log(`Ownership transferred: user ${newOwnerId} is now owner of workspace ${workspaceId} (${schemaName}). Previous owner ${previousOwnerId} role and permissions updated to admin.`);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error transferring ownership: ${workspaceId}: ${error.message}`);
            if (error.message?.includes('does not exist')) {
                throw custom_errors_1.customError.internalServerError('Workspace schema not found');
            }
            if (error.statusCode) {
                throw error;
            }
            throw custom_errors_1.customError.internalServerError('Failed to transfer ownership');
        }
        finally {
            await queryRunner.release();
        }
    }
    getMemberProfile(member) {
        return {
            id: member.id,
            userId: member.userId,
            role: member.role,
            isActive: member.isActive,
            joinedAt: member.joinedAt,
        };
    }
};
exports.MemberService = MemberService;
exports.MemberService = MemberService = MemberService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(workspace_entity_1.Workspace)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => workspace_service_1.WorkspacesService))),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        workspace_service_1.WorkspacesService,
        typeorm_2.Repository])
], MemberService);
//# sourceMappingURL=member.service.js.map