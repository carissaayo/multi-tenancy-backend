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
exports.ChannelInvitation = void 0;
const user_entity_1 = require("../../users/entities/user.entity");
const typeorm_1 = require("typeorm");
const workspace_interface_1 = require("../../workspaces/interfaces/workspace.interface");
let ChannelInvitation = class ChannelInvitation {
    id;
    channelId;
    workspaceId;
    memberId;
    token;
    invitedBy;
    inviter;
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
exports.ChannelInvitation = ChannelInvitation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChannelInvitation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'channel_id' }),
    __metadata("design:type", String)
], ChannelInvitation.prototype, "channelId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'workspace_id' }),
    __metadata("design:type", String)
], ChannelInvitation.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'member_id' }),
    __metadata("design:type", String)
], ChannelInvitation.prototype, "memberId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', unique: true }),
    __metadata("design:type", String)
], ChannelInvitation.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'invited_by', nullable: true }),
    __metadata("design:type", Object)
], ChannelInvitation.prototype, "invitedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'invited_by' }),
    __metadata("design:type", Object)
], ChannelInvitation.prototype, "inviter", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp', name: 'invited_at' }),
    __metadata("design:type", Date)
], ChannelInvitation.prototype, "invitedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'expires_at' }),
    __metadata("design:type", Date)
], ChannelInvitation.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'accepted_at', nullable: true }),
    __metadata("design:type", Object)
], ChannelInvitation.prototype, "acceptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'accepted_by', nullable: true }),
    __metadata("design:type", Object)
], ChannelInvitation.prototype, "acceptedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'accepted_by' }),
    __metadata("design:type", Object)
], ChannelInvitation.prototype, "acceptedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'revoked_at', nullable: true }),
    __metadata("design:type", Object)
], ChannelInvitation.prototype, "revokedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'revoked_by', nullable: true }),
    __metadata("design:type", Object)
], ChannelInvitation.prototype, "revokedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'revoked_by' }),
    __metadata("design:type", Object)
], ChannelInvitation.prototype, "revokedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: workspace_interface_1.WorkspaceInvitationStatus.PENDING,
    }),
    __metadata("design:type", String)
], ChannelInvitation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ChannelInvitation.prototype, "message", void 0);
exports.ChannelInvitation = ChannelInvitation = __decorate([
    (0, typeorm_1.Entity)({ name: 'channel_invitations', schema: 'public' }),
    (0, typeorm_1.Index)(['token'], { unique: true }),
    (0, typeorm_1.Index)(['channelId', 'memberId']),
    (0, typeorm_1.Index)(['expiresAt']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['channelId', 'memberId', 'status'], { unique: true })
], ChannelInvitation);
//# sourceMappingURL=channel_invitations.entity.js.map