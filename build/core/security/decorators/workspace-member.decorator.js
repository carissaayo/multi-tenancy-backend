"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceMember = void 0;
const common_1 = require("@nestjs/common");
exports.WorkspaceMember = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.workspaceMember;
});
//# sourceMappingURL=workspace-member.decorator.js.map