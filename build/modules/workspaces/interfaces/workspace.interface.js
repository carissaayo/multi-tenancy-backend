"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceInvitationRole = exports.WorkspaceInvitationStatus = exports.WorkspacePlan = void 0;
var WorkspacePlan;
(function (WorkspacePlan) {
    WorkspacePlan["FREE"] = "free";
    WorkspacePlan["PRO"] = "pro";
    WorkspacePlan["ENTERPRISE"] = "enterprise";
})(WorkspacePlan || (exports.WorkspacePlan = WorkspacePlan = {}));
var WorkspaceInvitationStatus;
(function (WorkspaceInvitationStatus) {
    WorkspaceInvitationStatus["PENDING"] = "pending";
    WorkspaceInvitationStatus["ACCEPTED"] = "accepted";
    WorkspaceInvitationStatus["EXPIRED"] = "expired";
    WorkspaceInvitationStatus["REVOKED"] = "revoked";
})(WorkspaceInvitationStatus || (exports.WorkspaceInvitationStatus = WorkspaceInvitationStatus = {}));
var WorkspaceInvitationRole;
(function (WorkspaceInvitationRole) {
    WorkspaceInvitationRole["MEMBER"] = "member";
    WorkspaceInvitationRole["ADMIN"] = "admin";
    WorkspaceInvitationRole["GUEST"] = "guest";
})(WorkspaceInvitationRole || (exports.WorkspaceInvitationRole = WorkspaceInvitationRole = {}));
//# sourceMappingURL=workspace.interface.js.map