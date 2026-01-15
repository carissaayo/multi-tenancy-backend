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
exports.TransferOwnershipDto = exports.DeactivateMemberDto = exports.RemoveUserFromWorkspaceDto = exports.ChangeMemberRoleDto = void 0;
const class_validator_1 = require("class-validator");
const workspace_interface_1 = require("../interfaces/workspace.interface");
class ChangeMemberRoleDto {
    targetUserId;
    newRole;
}
exports.ChangeMemberRoleDto = ChangeMemberRoleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangeMemberRoleDto.prototype, "targetUserId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangeMemberRoleDto.prototype, "newRole", void 0);
class RemoveUserFromWorkspaceDto {
    targetUserId;
}
exports.RemoveUserFromWorkspaceDto = RemoveUserFromWorkspaceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RemoveUserFromWorkspaceDto.prototype, "targetUserId", void 0);
class DeactivateMemberDto {
    targetUserId;
}
exports.DeactivateMemberDto = DeactivateMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeactivateMemberDto.prototype, "targetUserId", void 0);
class TransferOwnershipDto {
    targetUserId;
}
exports.TransferOwnershipDto = TransferOwnershipDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TransferOwnershipDto.prototype, "targetUserId", void 0);
//# sourceMappingURL=workspace-management.dto.js.map