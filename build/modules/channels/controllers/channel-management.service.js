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
var ChannelManagementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelManagementService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const member_service_1 = require("../../members/services/member.service");
const workspace_service_1 = require("../../workspaces/services/workspace.service");
const token_manager_service_1 = require("../../../core/security/services/token-manager.service");
const workspace_entity_1 = require("../../workspaces/entities/workspace.entity");
const typeorm_3 = require("typeorm");
let ChannelManagementService = ChannelManagementService_1 = class ChannelManagementService {
    dataSource;
    workspaceRepo;
    workspacesService;
    memberService;
    tokenManager;
    logger = new common_1.Logger(ChannelManagementService_1.name);
    constructor(dataSource, workspaceRepo, workspacesService, memberService, tokenManager) {
        this.dataSource = dataSource;
        this.workspaceRepo = workspaceRepo;
        this.workspacesService = workspacesService;
        this.memberService = memberService;
        this.tokenManager = tokenManager;
    }
    async joinChannel(req, id) {
        const user = req.user;
        const workspace = req.workspace;
    }
};
exports.ChannelManagementService = ChannelManagementService;
exports.ChannelManagementService = ChannelManagementService = ChannelManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(workspace_entity_1.Workspace)),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        typeorm_3.Repository,
        workspace_service_1.WorkspacesService,
        member_service_1.MemberService,
        token_manager_service_1.TokenManager])
], ChannelManagementService);
//# sourceMappingURL=channel-management.service.js.map