"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const security_module_1 = require("../../core/security/security.module");
const user_service_1 = require("./services/user.service");
const aws_storage_service_1 = require("../../core/storage/services/aws-storage.service");
const user_controller_1 = require("./controllers/user.controller");
const user_entity_1 = require("./entities/user.entity");
let UserModule = class UserModule {
};
exports.UserModule = UserModule;
exports.UserModule = UserModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User]), security_module_1.SecurityModule],
        providers: [user_service_1.UsersService, aws_storage_service_1.AWSStorageService],
        controllers: [user_controller_1.UsersController],
        exports: [user_service_1.UsersService],
    })
], UserModule);
//# sourceMappingURL=user.module.js.map