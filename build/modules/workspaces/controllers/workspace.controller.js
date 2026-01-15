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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const workspace_service_1 = require("../services/workspace.service");
const workspace_dto_1 = require("../dtos/workspace.dto");
let WorkspacesController = class WorkspacesController {
    workspaceService;
    constructor(workspaceService) {
        this.workspaceService = workspaceService;
    }
    create(createDto, req) {
        return this.workspaceService.create(req, createDto);
    }
    getUserWorkspaces(req) {
        return this.workspaceService.getUserWorkspaces(req);
    }
    getById(id, req) {
        return this.workspaceService.getUserSingleWorkspace(id, req);
    }
};
exports.WorkspacesController = WorkspacesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new workspace' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Workspace created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workspace_dto_1.CreateWorkspaceDto, Object]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(''),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all workspaces for authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of user workspaces' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getUserWorkspaces", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace by ID (with membership check)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Workspace details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkspacesController.prototype, "getById", null);
exports.WorkspacesController = WorkspacesController = __decorate([
    (0, swagger_1.ApiTags)('Workspaces'),
    (0, common_1.Controller)('workspaces'),
    __metadata("design:paramtypes", [workspace_service_1.WorkspacesService])
], WorkspacesController);
//# sourceMappingURL=workspace.controller.js.map