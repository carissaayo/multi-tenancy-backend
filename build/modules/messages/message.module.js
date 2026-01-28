"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const workspace_module_1 = require("../workspaces/workspace.module");
const member_module_1 = require("../members/member.module");
const security_module_1 = require("../../core/security/security.module");
const channel_module_1 = require("../channels/channel.module");
const messaging_gateway_1 = require("./gateways/messaging.gateway");
const message_service_1 = require("./services/message.service");
const message_controller_1 = require("./controllers/message.controller");
const user_module_1 = require("../users/user.module");
let MessageModule = class MessageModule {
};
exports.MessageModule = MessageModule;
exports.MessageModule = MessageModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('ACCESS_TOKEN_SECRET'),
                    signOptions: {
                        expiresIn: (configService.get('JWT_EXPIRES_IN', '1h') ||
                            '1h'),
                    },
                }),
            }),
            (0, common_1.forwardRef)(() => workspace_module_1.WorkspaceModule),
            (0, common_1.forwardRef)(() => member_module_1.MemberModule),
            (0, common_1.forwardRef)(() => security_module_1.SecurityModule),
            (0, common_1.forwardRef)(() => channel_module_1.ChannelModule),
            user_module_1.UserModule
        ],
        providers: [messaging_gateway_1.MessagingGateway, message_service_1.MessageService],
        controllers: [message_controller_1.MessageController],
        exports: [messaging_gateway_1.MessagingGateway, message_service_1.MessageService],
    })
], MessageModule);
//# sourceMappingURL=message.module.js.map