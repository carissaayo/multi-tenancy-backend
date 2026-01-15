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
exports.FeatureFlag = void 0;
const workspace_entity_1 = require("../../../modules/workspaces/entities/workspace.entity");
const typeorm_1 = require("typeorm");
let FeatureFlag = class FeatureFlag {
    id;
    workspaceId;
    workspace;
    featureKey;
    isEnabled;
    metadata;
};
exports.FeatureFlag = FeatureFlag;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FeatureFlag.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'workspace_id' }),
    __metadata("design:type", String)
], FeatureFlag.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", workspace_entity_1.Workspace)
], FeatureFlag.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'feature_key' }),
    __metadata("design:type", String)
], FeatureFlag.prototype, "featureKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_enabled' }),
    __metadata("design:type", Boolean)
], FeatureFlag.prototype, "isEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], FeatureFlag.prototype, "metadata", void 0);
exports.FeatureFlag = FeatureFlag = __decorate([
    (0, typeorm_1.Entity)({ name: 'feature_flags', schema: 'public' }),
    (0, typeorm_1.Unique)(['workspaceId', 'featureKey'])
], FeatureFlag);
//# sourceMappingURL=feature-flag.entity.js.map