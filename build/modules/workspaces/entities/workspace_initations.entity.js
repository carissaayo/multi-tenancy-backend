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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceInvitation = void 0;
const user_entity_1 = require("../../users/entities/user.entity");
const workspace_entity_1 = require("../entities/workspace.entity");
const typeorm_1 = require("typeorm");
const workspace_interface_1 = require("../interfaces/workspace.interface");
let WorkspaceInvitation = class WorkspaceInvitation {
    id;
    workspaceId;
    workspace;
    email;
    role;
    token;
    invitedBy;
    inviter;
    sentTo;
    sentToId;
    invitedAt;
    expiresAt;
    acceptedAt;
    acceptedBy;
    acceptedByUser;
    revokedAt;
    revokedBy;
    revokedByUser;
    status;
    message;
};
exports.WorkspaceInvitation = WorkspaceInvitation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkspaceInvitation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'workspace_id' }),
    __metadata("design:type", String)
], WorkspaceInvitation.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", workspace_entity_1.Workspace)
], WorkspaceInvitation.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], WorkspaceInvitation.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: workspace_interface_1.WorkspaceInvitationRole.MEMBER,
    }),
    __metadata("design:type", String)
], WorkspaceInvitation.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', unique: true }),
    __metadata("design:type", String)
], WorkspaceInvitation.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'invited_by', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "invitedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'invited_by' }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "inviter", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'sent_to' }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "sentTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'sentTo', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "sentToId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp', name: 'invited_at' }),
    __metadata("design:type", Date)
], WorkspaceInvitation.prototype, "invitedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'expires_at' }),
    __metadata("design:type", Date)
], WorkspaceInvitation.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'accepted_at', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "acceptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'accepted_by', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "acceptedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'accepted_by' }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "acceptedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'revoked_at', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "revokedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'revoked_by', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "revokedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'revoked_by' }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "revokedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: workspace_interface_1.WorkspaceInvitationStatus.PENDING,
    }),
    __metadata("design:type", String)
], WorkspaceInvitation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvitation.prototype, "message", void 0);
exports.WorkspaceInvitation = WorkspaceInvitation = __decorate([
    (0, typeorm_1.Entity)({ name: 'workspace_invitations', schema: 'public' }),
    (0, typeorm_1.Index)(['token'], { unique: true }),
    (0, typeorm_1.Index)(['workspaceId', 'email']),
    (0, typeorm_1.Index)(['expiresAt']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['workspaceId', 'email', 'status'], { unique: true })
], WorkspaceInvitation);
//# sourceMappingURL=workspace_initations.entity.js.map