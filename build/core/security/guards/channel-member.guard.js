"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ChannelMemberGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelMemberGuard = exports.RequireChannelMembership = void 0;
const common_1 = require("@nestjs/common");
const custom_errors_1 = require("../../error-handler/custom-errors");
const RequireChannelMembership = () => (0, common_1.SetMetadata)('require-channel-membership', true);
exports.RequireChannelMembership = RequireChannelMembership;
let ChannelMemberGuard = ChannelMemberGuard_1 = class ChannelMemberGuard {
    logger = new common_1.Logger(ChannelMemberGuard_1.name);
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const channelMember = request.channelMember;
        const channelId = request.params.channelId || request.body.channelId;
        if (!channelMember) {
            this.logger.warn(`User ${request.user?.id} is not a member of channel ${channelId}`);
            throw custom_errors_1.customError.forbidden('You are not a member of this channel');
        }
        this.logger.debug(`✅ Channel member guard passed: User ${request.user?.id} in channel ${channelId}`);
        return true;
    }
};
exports.ChannelMemberGuard = ChannelMemberGuard;
exports.ChannelMemberGuard = ChannelMemberGuard = ChannelMemberGuard_1 = __decorate([
    (0, common_1.Injectable)()
], ChannelMemberGuard);
//# sourceMappingURL=channel-member.guard.js.map