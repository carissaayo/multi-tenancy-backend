"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissions = exports.PermissionsEnum = void 0;
var PermissionsEnum;
(function (PermissionsEnum) {
    PermissionsEnum["WORKSPACE_CREATE"] = "workspace:create";
    PermissionsEnum["WORKSPACE_UPDATE"] = "workspace:update";
    PermissionsEnum["WORKSPACE_DELETE"] = "workspace:delete";
    PermissionsEnum["WORKSPACE_VIEW"] = "workspace:view";
    PermissionsEnum["WORKSPACE_SETTINGS"] = "workspace:settings";
    PermissionsEnum["MEMBER_INVITE"] = "member:invite";
    PermissionsEnum["MEMBER_REMOVE"] = "member:remove";
    PermissionsEnum["MEMBER_UPDATE_ROLE"] = "member:update_role";
    PermissionsEnum["MEMBER_VIEW"] = "member:view";
    PermissionsEnum["MEMBER_DEACTIVATE"] = "member:deactivate";
    PermissionsEnum["CHANNEL_CREATE"] = "channel:create";
    PermissionsEnum["CHANNEL_UPDATE"] = "channel:update";
    PermissionsEnum["CHANNEL_DELETE"] = "channel:delete";
    PermissionsEnum["CHANNEL_VIEW"] = "channel:view";
    PermissionsEnum["CHANNEL_ARCHIVE"] = "channel:archive";
    PermissionsEnum["CHANNEL_MANAGE_MEMBERS"] = "channel:manage_members";
    PermissionsEnum["MESSAGE_CREATE"] = "message:create";
    PermissionsEnum["MESSAGE_UPDATE"] = "message:update";
    PermissionsEnum["MESSAGE_DELETE"] = "message:delete";
    PermissionsEnum["MESSAGE_VIEW"] = "message:view";
    PermissionsEnum["MESSAGE_DELETE_ANY"] = "message:delete_any";
    PermissionsEnum["MESSAGE_PIN"] = "message:pin";
    PermissionsEnum["FILE_UPLOAD"] = "file:upload";
    PermissionsEnum["FILE_DELETE"] = "file:delete";
    PermissionsEnum["FILE_VIEW"] = "file:view";
    PermissionsEnum["FILE_DELETE_ANY"] = "file:delete_any";
    PermissionsEnum["NOTIFICATION_SEND"] = "notification:send";
    PermissionsEnum["NOTIFICATION_MANAGE"] = "notification:manage";
    PermissionsEnum["ANALYTICS_VIEW"] = "analytics:view";
    PermissionsEnum["ANALYTICS_EXPORT"] = "analytics:export";
    PermissionsEnum["USAGE_METRICS_VIEW"] = "usage:metrics_view";
    PermissionsEnum["FEATURE_FLAG_MANAGE"] = "feature_flag:manage";
    PermissionsEnum["FEATURE_FLAG_VIEW"] = "feature_flag:view";
    PermissionsEnum["BILLING_VIEW"] = "billing:view";
    PermissionsEnum["BILLING_MANAGE"] = "billing:manage";
    PermissionsEnum["PLAN_UPGRADE"] = "plan:upgrade";
    PermissionsEnum["AUDIT_LOG_VIEW"] = "audit_log:view";
    PermissionsEnum["AUDIT_LOG_EXPORT"] = "audit_log:export";
    PermissionsEnum["INTEGRATION_MANAGE"] = "integration:manage";
    PermissionsEnum["INTEGRATION_VIEW"] = "integration:view";
    PermissionsEnum["ADMIN_USERS"] = "admin:users";
    PermissionsEnum["ADMIN_WORKSPACES"] = "admin:workspaces";
    PermissionsEnum["ADMIN_SYSTEM_SETTINGS"] = "admin:system_settings";
    PermissionsEnum["SUPER_ADMIN"] = "super_admin";
})(PermissionsEnum || (exports.PermissionsEnum = PermissionsEnum = {}));
exports.RolePermissions = {
    owner: [
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
//# sourceMappingURL=permission.interface.js.map