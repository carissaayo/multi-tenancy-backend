export const publicRoutes = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/request-password-reset',
  '/api/auth/password-reset',
  '/api/payment/paystack/webhook',
  '/api/invitations/accept',
  '/api/docs',
];

export const workspaceOptionalRoutes = [
  '/api/workspaces',
  '/api/workspaces/:id',
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
  "/api/api/docs"
];


export const allowDeactivatedWorkspaceRoutes = [
  '/api/settings/activate',
  'api/workspaces',
  '/api/workspaces/:id',
  '/api/auth/select-workspace',
  '/api/workspaces/:id/members',
  '/api/settings/delete',
  '/api/management/leave',
];