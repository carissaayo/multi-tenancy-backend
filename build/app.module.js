"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_1 = require("@nestjs/config");
const database_config_1 = require("./config/database.config");
const database_module_1 = require("./core/database/database.module");
const security_module_1 = require("./core/security/security.module");
const config_2 = __importDefault(require("./config/config"));
const config_validation_1 = require("./config/config.validation");
const auth_module_1 = require("./modules/auth/auth.module");
const workspace_module_1 = require("./modules/workspaces/workspace.module");
const user_module_1 = require("./modules/users/user.module");
const channel_module_1 = require("./modules/channels/channel.module");
const message_module_1 = require("./modules/messages/message.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
                load: [config_2.default, database_config_1.databaseConfig],
                validate: config_validation_1.validateEnv,
            }),
            database_module_1.DatabaseModule,
            security_module_1.SecurityModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            workspace_module_1.WorkspaceModule,
            channel_module_1.ChannelModule,
            message_module_1.MessageModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map