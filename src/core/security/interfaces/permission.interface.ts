export enum PermissionsEnum {
  // Workspace Management
  WORKSPACE_CREATE = 'workspace:create',
  WORKSPACE_UPDATE = 'workspace:update',
  WORKSPACE_DELETE = 'workspace:delete',
  WORKSPACE_VIEW = 'workspace:view',
  WORKSPACE_SETTINGS = 'workspace:settings',

  // Member Management
  MEMBER_INVITE = 'member:invite',
  MEMBER_REMOVE = 'member:remove',
  MEMBER_UPDATE_ROLE = 'member:update_role',
  MEMBER_VIEW = 'member:view',
  MEMBER_DEACTIVATE = 'member:deactivate',

  // Channel Management
  CHANNEL_CREATE = 'channel:create',
  CHANNEL_UPDATE = 'channel:update',
  CHANNEL_DELETE = 'channel:delete',
  CHANNEL_VIEW = 'channel:view',
  CHANNEL_ARCHIVE = 'channel:archive',
  CHANNEL_MANAGE_MEMBERS = 'channel:manage_members',

  // Message Management
  MESSAGE_CREATE = 'message:create',
  MESSAGE_UPDATE = 'message:update',
  MESSAGE_DELETE = 'message:delete',
  MESSAGE_VIEW = 'message:view',
  MESSAGE_DELETE_ANY = 'message:delete_any', 
  MESSAGE_PIN = 'message:pin',

  // File Management
  FILE_UPLOAD = 'file:upload',
  FILE_DELETE = 'file:delete',
  FILE_VIEW = 'file:view',
  FILE_DELETE_ANY = 'file:delete_any',

  // Notifications
  NOTIFICATION_SEND = 'notification:send',
  NOTIFICATION_MANAGE = 'notification:manage',

  // Analytics & Reporting
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  USAGE_METRICS_VIEW = 'usage:metrics_view',

  // Feature Flags
  FEATURE_FLAG_MANAGE = 'feature_flag:manage',
  FEATURE_FLAG_VIEW = 'feature_flag:view',

  // Billing & Plans
  BILLING_VIEW = 'billing:view',
  BILLING_MANAGE = 'billing:manage',
  PLAN_UPGRADE = 'plan:upgrade',

  // Audit Logs
  AUDIT_LOG_VIEW = 'audit_log:view',
  AUDIT_LOG_EXPORT = 'audit_log:export',

  // Integrations
  INTEGRATION_MANAGE = 'integration:manage',
  INTEGRATION_VIEW = 'integration:view',

  // Admin/Super Admin
  ADMIN_USERS = 'admin:users',
  ADMIN_WORKSPACES = 'admin:workspaces',
  ADMIN_SYSTEM_SETTINGS = 'admin:system_settings',
  SUPER_ADMIN = 'super_admin',
}

// Role-based permission mapping
export const RolePermissions: Record<string, PermissionsEnum[]> = {
  owner: [
    // Full access to everything
    PermissionsEnum.WORKSPACE_CREATE,
    PermissionsEnum.WORKSPACE_UPDATE,
    PermissionsEnum.WORKSPACE_DELETE,
    PermissionsEnum.WORKSPACE_VIEW,
    PermissionsEnum.WORKSPACE_SETTINGS,
    PermissionsEnum.MEMBER_INVITE,
    PermissionsEnum.MEMBER_REMOVE,
    PermissionsEnum.MEMBER_UPDATE_ROLE,
    PermissionsEnum.MEMBER_VIEW,
    PermissionsEnum.MEMBER_DEACTIVATE,
    PermissionsEnum.CHANNEL_CREATE,
    PermissionsEnum.CHANNEL_UPDATE,
    PermissionsEnum.CHANNEL_DELETE,
    PermissionsEnum.CHANNEL_VIEW,
    PermissionsEnum.CHANNEL_ARCHIVE,
    PermissionsEnum.CHANNEL_MANAGE_MEMBERS,
    PermissionsEnum.MESSAGE_CREATE,
    PermissionsEnum.MESSAGE_UPDATE,
    PermissionsEnum.MESSAGE_DELETE,
    PermissionsEnum.MESSAGE_VIEW,
    PermissionsEnum.MESSAGE_DELETE_ANY,
    PermissionsEnum.MESSAGE_PIN,
    PermissionsEnum.FILE_UPLOAD,
    PermissionsEnum.FILE_DELETE,
    PermissionsEnum.FILE_VIEW,
    PermissionsEnum.FILE_DELETE_ANY,
    PermissionsEnum.NOTIFICATION_SEND,
    PermissionsEnum.NOTIFICATION_MANAGE,
    PermissionsEnum.ANALYTICS_VIEW,
    PermissionsEnum.ANALYTICS_EXPORT,
    PermissionsEnum.USAGE_METRICS_VIEW,
    PermissionsEnum.FEATURE_FLAG_MANAGE,
    PermissionsEnum.FEATURE_FLAG_VIEW,
    PermissionsEnum.BILLING_VIEW,
    PermissionsEnum.BILLING_MANAGE,
    PermissionsEnum.PLAN_UPGRADE,
    PermissionsEnum.AUDIT_LOG_VIEW,
    PermissionsEnum.AUDIT_LOG_EXPORT,
    PermissionsEnum.INTEGRATION_MANAGE,
    PermissionsEnum.INTEGRATION_VIEW,
  ],

  admin: [
    PermissionsEnum.WORKSPACE_VIEW,
    PermissionsEnum.WORKSPACE_SETTINGS,
    PermissionsEnum.MEMBER_INVITE,
    PermissionsEnum.MEMBER_REMOVE,
    PermissionsEnum.MEMBER_VIEW,
    PermissionsEnum.CHANNEL_CREATE,
    PermissionsEnum.CHANNEL_UPDATE,
    PermissionsEnum.CHANNEL_DELETE,
    PermissionsEnum.CHANNEL_VIEW,
    PermissionsEnum.CHANNEL_ARCHIVE,
    PermissionsEnum.CHANNEL_MANAGE_MEMBERS,
    PermissionsEnum.MESSAGE_CREATE,
    PermissionsEnum.MESSAGE_UPDATE,
    PermissionsEnum.MESSAGE_DELETE,
    PermissionsEnum.MESSAGE_VIEW,
    PermissionsEnum.MESSAGE_DELETE_ANY,
    PermissionsEnum.MESSAGE_PIN,
    PermissionsEnum.FILE_UPLOAD,
    PermissionsEnum.FILE_DELETE,
    PermissionsEnum.FILE_VIEW,
    PermissionsEnum.FILE_DELETE_ANY,
    PermissionsEnum.NOTIFICATION_SEND,
    PermissionsEnum.ANALYTICS_VIEW,
    PermissionsEnum.USAGE_METRICS_VIEW,
    PermissionsEnum.FEATURE_FLAG_VIEW,
    PermissionsEnum.AUDIT_LOG_VIEW,
    PermissionsEnum.INTEGRATION_VIEW,
  ],

  member: [
    PermissionsEnum.WORKSPACE_VIEW,
    PermissionsEnum.MEMBER_VIEW,
    PermissionsEnum.CHANNEL_CREATE,
    PermissionsEnum.CHANNEL_VIEW,
    PermissionsEnum.MESSAGE_CREATE,
    PermissionsEnum.MESSAGE_UPDATE,
    PermissionsEnum.MESSAGE_DELETE,
    PermissionsEnum.MESSAGE_VIEW,
    PermissionsEnum.FILE_UPLOAD,
    PermissionsEnum.FILE_DELETE,
    PermissionsEnum.FILE_VIEW,
    PermissionsEnum.NOTIFICATION_SEND,
  ],

  guest: [
    PermissionsEnum.WORKSPACE_VIEW,
    PermissionsEnum.MEMBER_VIEW,
    PermissionsEnum.CHANNEL_VIEW,
    PermissionsEnum.MESSAGE_VIEW,
    PermissionsEnum.FILE_VIEW,
  ],

  super_admin: [
    PermissionsEnum.SUPER_ADMIN,
    PermissionsEnum.ADMIN_USERS,
    PermissionsEnum.ADMIN_WORKSPACES,
    PermissionsEnum.ADMIN_SYSTEM_SETTINGS,
  ],
};
