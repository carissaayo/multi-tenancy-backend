export const publicRoutes = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/request-password-reset',
  '/api/auth/password-reset',
  '/api/payment/paystack/webhook',
  '/api/invitations/accept',
];

export const workspaceOptionalRoutes = [
  '/api/workspaces', // POST (create), GET (list user workspaces)
  '/api/workspaces/:id', // GET single workspace by ID
  '/api/invitations', // POST (create invitation), GET (list invitations)
  '/api/users',
  '/api/users/avatar',
  
  '/api/auth/password-reset',
  '/api/auth/request-password-reset',
  '/api/auth/verify-email',
  '/api/auth/change-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  "/api/auth/resend-verification-email",
];