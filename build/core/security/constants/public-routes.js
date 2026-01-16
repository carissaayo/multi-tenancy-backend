"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowDeactivatedWorkspaceRoutes = exports.workspaceOptionalRoutes = exports.publicRoutes = void 0;
exports.publicRoutes = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/request-password-reset',
    '/api/auth/password-reset',
    '/api/payment/paystack/webhook',
    '/api/invitations/accept',
    "/api/docs"
];
exports.workspaceOptionalRoutes = [
    '/api/workspaces',
    '/api/workspaces/:id',
    '/api/invitations',
    '/api/users',
    '/api/users/avatar',
    '/api/auth/password-reset',
    '/api/auth/request-password-reset',
    '/api/auth/verify-email',
    '/api/auth/change-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/auth/resend-verification-email',
    '/api/auth/select-workspace',
    '/api/invitations/accept',
    '/api/channels/invitations/accept',
    '/api/docs',
];
exports.allowDeactivatedWorkspaceRoutes = [
    '/api/settings/activate',
];
//# sourceMappingURL=public-routes.js.map