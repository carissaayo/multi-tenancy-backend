"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = class EmailService {
    configService;
    transporter;
    constructor(configService) {
        this.configService = configService;
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get('EMAIL_USERNAME'),
                pass: this.configService.get('EMAIL_PASSWORD'),
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
        this.transporter.verify((error, success) => {
            if (error) {
                console.error('Email service connection error:', error);
            }
            else {
                console.log('✅ Email service is ready to send messages');
            }
        });
    }
    buildTemplate({ title, greeting, body, footer, workspaceName, }) {
        const appName = this.configService.get('app.name') || 'WorkSpace';
        const headerText = workspaceName
            ? `${workspaceName} • ${appName}`
            : appName;
        return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; margin:0; padding:20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <tr>
          <td style="background:#4F46E5; padding:20px; text-align:center; color:#ffffff; font-size:20px; font-weight:bold;">
            ${headerText}
          </td>
        </tr>
        <tr>
          <td style="padding:20px; color:#333333; font-size:15px; line-height:1.6;">
            ${greeting ? `<p>${greeting}</p>` : ''}
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px; background:#f9fafb; color:#555555; font-size:13px; text-align:center;">
            ${footer || `© ${new Date().getFullYear()} ${appName}. All rights reserved.`}
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
    }
    async sendEmail(emailOptions) {
        try {
            const adminEmail = this.configService.get('admin.email');
            const mailOptions = {
                from: adminEmail,
                to: emailOptions.to,
                subject: emailOptions.subject,
                text: emailOptions.text,
                html: emailOptions.html,
            };
            const info = await this.transporter.sendMail(mailOptions);
            console.log('📧 Email sent successfully', info.messageId);
        }
        catch (error) {
            console.error('❌ Error sending email:', error);
        }
    }
    async sendBatchEmails(recipients, subject, htmlBuilder, textBuilder) {
        const promises = recipients.map((member) => this.sendEmail({
            to: member.email,
            subject,
            html: htmlBuilder(member),
            text: textBuilder(member),
        }));
        await Promise.allSettled(promises);
    }
    async sendVerificationEmail(email, code) {
        const subject = 'Email Verification';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi,`,
            body: `<p>Your verification code is:</p>
             <h2 style="text-align:center; color:#4F46E5; letter-spacing: 3px;">${code}</h2>
             <p>Please use this code to verify your email address.</p>
             <p>This code will expire in 10 minutes.</p>`,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your verification code is: ${code}`,
            html,
        });
    }
    async sendVerificationSuccessEmail(email, firstName) {
        const subject = 'Email Verified Successfully';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Your email has been verified successfully! 🎉</p>
             <p>You can now create or join workspaces.</p>`,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your email has been verified successfully.`,
            html,
        });
    }
    async resendVerificationCode(email, code) {
        const subject = 'Verification Code Resent';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi,`,
            body: `<p>Here's your new verification code:</p>
             <h2 style="text-align:center; color:#4F46E5; letter-spacing: 3px;">${code}</h2>
             <p>Please use this code to verify your email address.</p>
             <p>This code will expire in 10 minutes.</p>`,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your new verification code is: ${code}`,
            html,
        });
    }
    async sendPasswordResetEmail(email, code) {
        const subject = 'Password Reset';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi,`,
            body: `<p>Your password reset code is:</p>
             <h2 style="text-align:center; color:#DC2626; letter-spacing: 3px;">${code}</h2>
             <p>This code will expire in 30 minutes. If you didn't request this, please ignore this email.</p>`,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your reset code is: ${code}`,
            html,
        });
    }
    async sendPasswordChangeNotificationEmail(email, firstName) {
        const subject = 'Password Changed';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Your password has been changed successfully.</p>
             <p>If this wasn't you, please contact support immediately.</p>`,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Hi ${firstName}, your password has been changed.`,
            html,
        });
    }
    async send2FAEnabled(email, firstName) {
        const subject = 'Two-Factor Authentication Enabled';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Two-factor authentication has been enabled on your account.</p>
             <p>Your account is now more secure. You'll need to enter a verification code when logging in from new devices.</p>
             <p>If this wasn't you, please contact support immediately.</p>`,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Two-factor authentication has been enabled on your account.`,
            html,
        });
    }
    async send2FADisabled(email, firstName) {
        const subject = 'Two-Factor Authentication Disabled';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Two-factor authentication has been disabled on your account.</p>
             <p>If this wasn't you, please enable 2FA immediately and contact support.</p>`,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Two-factor authentication has been disabled on your account.`,
            html,
        });
    }
    async sendNewDeviceLogin(email, firstName, device, location, timestamp) {
        const subject = 'New Device Login Detected';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>We detected a new login to your account:</p>
             <p><strong>Device:</strong> ${device}</p>
             <p><strong>Location:</strong> ${location}</p>
             <p><strong>Time:</strong> ${timestamp}</p>
             <p>If this was you, you can safely ignore this email.</p>
             <p>If this wasn't you, please secure your account immediately by changing your password.</p>`,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `New login detected from ${device} at ${location}`,
            html,
        });
    }
    async sendWorkspaceCreated(email, firstName, workspaceName, workspaceUrl) {
        const subject = 'Workspace Created Successfully';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Your workspace <strong>${workspaceName}</strong> has been created successfully! 🎉</p>
             <p>You can now invite team members and start collaborating.</p>
             <p style="margin:20px 0;">
               <a href="${workspaceUrl}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Go to Workspace
               </a>
             </p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your workspace ${workspaceName} has been created.`,
            html,
        });
    }
    async sendWorkspaceSetupComplete(email, firstName, workspaceName, workspaceUrl) {
        const subject = 'Workspace Setup Complete';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>You've completed the setup for <strong>${workspaceName}</strong>!</p>
             <p>Your team is ready to collaborate. Start by inviting members or creating channels.</p>
             <p style="margin:20px 0;">
               <a href="${workspaceUrl}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Go to Workspace
               </a>
             </p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Setup complete for ${workspaceName}`,
            html,
        });
    }
    async notifyWorkspaceNameChange(members, oldName, newName, changedBy) {
        const subject = 'Workspace Name Changed';
        await this.sendBatchEmails(members, subject, (member) => this.buildTemplate({
            title: subject,
            greeting: `Hi ${member.firstName || 'there'},`,
            body: `<p>The workspace name has been changed by ${changedBy}:</p>
               <p><strong>Old name:</strong> ${oldName}</p>
               <p><strong>New name:</strong> ${newName}</p>`,
            workspaceName: newName,
        }), (member) => `The workspace ${oldName} has been renamed to ${newName} by ${changedBy}`);
    }
    async notifyWorkspaceSettingsUpdated(members, workspaceName, settingChanged, changedBy) {
        const subject = 'Workspace Settings Updated';
        await this.sendBatchEmails(members, subject, (member) => this.buildTemplate({
            title: subject,
            greeting: `Hi ${member.firstName || 'there'},`,
            body: `<p>${changedBy} updated the workspace settings:</p>
               <p><strong>Setting changed:</strong> ${settingChanged}</p>`,
            workspaceName,
        }), (member) => `${changedBy} updated workspace settings: ${settingChanged}`);
    }
    async notifyWorkspaceDeletionScheduled(members, workspaceName, deletionDate, reason) {
        const subject = 'Workspace Deletion Scheduled';
        await this.sendBatchEmails(members, subject, (member) => this.buildTemplate({
            title: subject,
            greeting: `Hi ${member.firstName || 'there'},`,
            body: `<p><strong>${workspaceName}</strong> is scheduled for deletion.</p>
               <p><strong>Deletion date:</strong> ${deletionDate}</p>
               ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
               <p>All data will be permanently deleted. If you want to prevent this, contact the workspace owner immediately.</p>`,
            workspaceName,
        }), (member) => `${workspaceName} will be deleted on ${deletionDate}`);
    }
    async notifyWorkspaceArchived(members, workspaceName, archivedBy) {
        const subject = 'Workspace Archived';
        await this.sendBatchEmails(members, subject, (member) => this.buildTemplate({
            title: subject,
            greeting: `Hi ${member.firstName || 'there'},`,
            body: `<p><strong>${workspaceName}</strong> has been archived by ${archivedBy}.</p>
               <p>The workspace is now read-only. Contact the owner to restore it.</p>`,
            workspaceName,
        }), (member) => `${workspaceName} has been archived by ${archivedBy}`);
    }
    async sendOwnershipTransferRequest(newOwnerEmail, newOwnerName, workspaceName, currentOwner, acceptLink) {
        const subject = 'Workspace Ownership Transfer Request';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${newOwnerName},`,
            body: `<p>${currentOwner} wants to transfer ownership of <strong>${workspaceName}</strong> to you.</p>
             <p>As the new owner, you'll have full control over the workspace, including:</p>
             <ul>
               <li>Managing all members and permissions</li>
               <li>Workspace settings and billing</li>
               <li>Deleting or archiving the workspace</li>
             </ul>
             <p style="margin:20px 0;">
               <a href="${acceptLink}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Accept Ownership
               </a>
             </p>
             <p>This link will expire in 48 hours.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: newOwnerEmail,
            subject,
            text: `${currentOwner} wants to transfer ownership of ${workspaceName} to you.`,
            html,
        });
    }
    async notifyOwnershipTransferCompleted(oldOwnerEmail, oldOwnerName, newOwnerName, workspaceName) {
        const subject = 'Ownership Transfer Completed';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${oldOwnerName},`,
            body: `<p>Ownership of <strong>${workspaceName}</strong> has been successfully transferred to ${newOwnerName}.</p>
             <p>You are now a regular member of this workspace.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: oldOwnerEmail,
            subject,
            text: `Ownership of ${workspaceName} transferred to ${newOwnerName}`,
            html,
        });
    }
    async notifyNewOwner(newOwnerEmail, newOwnerName, workspaceName, previousOwner) {
        const subject = 'You Are Now the Workspace Owner';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${newOwnerName},`,
            body: `<p>You are now the owner of <strong>${workspaceName}</strong>!</p>
             <p>Previous owner: ${previousOwner}</p>
             <p>You now have full control over workspace settings, billing, and member management.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: newOwnerEmail,
            subject,
            text: `You are now the owner of ${workspaceName}`,
            html,
        });
    }
    async notifyAdminRoleGranted(email, firstName, workspaceName, grantedBy) {
        const subject = 'Admin Role Granted';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>You've been granted admin privileges in <strong>${workspaceName}</strong> by ${grantedBy}.</p>
             <p>You can now manage members, channels, and workspace settings.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `You are now an admin in ${workspaceName}`,
            html,
        });
    }
    async notifyAdminRoleRevoked(email, firstName, workspaceName, revokedBy) {
        const subject = 'Admin Role Revoked';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Your admin privileges in <strong>${workspaceName}</strong> have been revoked by ${revokedBy}.</p>
             <p>You are now a regular member of this workspace.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your admin role in ${workspaceName} has been revoked`,
            html,
        });
    }
    async notifyBillingChange(email, firstName, workspaceName, changeDetails) {
        const subject = 'Billing Updated';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>The billing information for <strong>${workspaceName}</strong> has been updated.</p>
             <p><strong>Change:</strong> ${changeDetails}</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Billing updated for ${workspaceName}`,
            html,
        });
    }
    async sendWorkspaceInvitation(email, workspaceName, inviterName, inviteLink, expiresIn) {
        const subject = `You're invited to join ${workspaceName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi,`,
            body: `<p>${inviterName} has invited you to join <strong>${workspaceName}</strong>.</p>
             <p>Click the button below to accept the invitation and get started:</p>
             <p style="margin:20px 0;">
               <a href="${inviteLink}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Join Workspace
               </a>
             </p>
             <p>This invitation expires in ${expiresIn}.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `${inviterName} invited you to join ${workspaceName}. Link: ${inviteLink}`,
            html,
        });
    }
    async sendInvitationReminder(email, workspaceName, inviterName, inviteLink, expiresIn) {
        const subject = `Reminder: Join ${workspaceName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi,`,
            body: `<p>This is a reminder that ${inviterName} invited you to join <strong>${workspaceName}</strong>.</p>
             <p>Don't miss out! Join now:</p>
             <p style="margin:20px 0;">
               <a href="${inviteLink}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Join Workspace
               </a>
             </p>
             <p>This invitation expires in ${expiresIn}.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Reminder: Join ${workspaceName}. Link: ${inviteLink}`,
            html,
        });
    }
    async sendInvitationExpired(email, workspaceName, inviterName) {
        const subject = `Invitation to ${workspaceName} Expired`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi,`,
            body: `<p>Your invitation to join <strong>${workspaceName}</strong> from ${inviterName} has expired.</p>
             <p>If you still want to join, please contact ${inviterName} for a new invitation.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your invitation to ${workspaceName} has expired.`,
            html,
        });
    }
    async sendChannelInvitation(email, workspaceName, channelName, inviterName, inviteLink, expiresIn) {
        const subject = `You're invited to join ${channelName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi,`,
            body: `<p>${inviterName} has invited you to join <strong>${workspaceName} - ${channelName}</strong>.</p>
             <p>Click the button below to accept the invitation and get started:</p>
             <p style="margin:20px 0;">
               <a href="${inviteLink}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Join Channel
               </a>
             </p>
             <p>This invitation expires in ${expiresIn}.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `${inviterName} invited you to join ${workspaceName}. Link: ${inviteLink}`,
            html,
        });
    }
    async sendWelcomeToWorkspace(email, firstName, workspaceName, workspaceUrl, inviterName) {
        const subject = `Welcome to ${workspaceName}!`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Welcome to <strong>${workspaceName}</strong>! 🎉</p>
             ${inviterName ? `<p>You were invited by ${inviterName}.</p>` : ''}
             <p>Get started by exploring channels and connecting with your team.</p>
             <p style="margin:20px 0;">
               <a href="${workspaceUrl}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Go to Workspace
               </a>
             </p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Welcome to ${workspaceName}!`,
            html,
        });
    }
    async notifyMemberAdded(email, firstName, workspaceName, addedBy) {
        const subject = `Added to ${workspaceName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>You've been added to <strong>${workspaceName}</strong> by ${addedBy}.</p>
             <p>You can now access all workspace resources and channels.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `You've been added to ${workspaceName} by ${addedBy}`,
            html,
        });
    }
    async notifyMemberRemoved(email, firstName, workspaceName, removedBy, reason) {
        const subject = `Removed from ${workspaceName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>You've been removed from <strong>${workspaceName}</strong> by ${removedBy}.</p>
             ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
             <p>You no longer have access to this workspace.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `You've been removed from ${workspaceName}`,
            html,
        });
    }
    async notifyRoleChanged(email, firstName, workspaceName, newRole, changedBy) {
        const subject = 'Your Role Has Changed';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Your role in <strong>${workspaceName}</strong> has been changed by ${changedBy}.</p>
             <p><strong>New role:</strong> ${newRole}</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your role in ${workspaceName} has been changed to ${newRole}`,
            html,
        });
    }
    async notifyMemberLeft(email, firstName, workspaceName) {
        const subject = `You've Left ${workspaceName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>You've successfully left <strong>${workspaceName}</strong>.</p>
             <p>You no longer have access to workspace resources. If this was a mistake, contact the workspace owner to rejoin.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `You've left ${workspaceName}`,
            html,
        });
    }
    async notifyMemberDeactivated(email, firstName, workspaceName, deactivatedBy) {
        const subject = 'Account Deactivated';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Your account in <strong>${workspaceName}</strong> has been deactivated by ${deactivatedBy}.</p>
             <p>You can no longer access this workspace. Contact the workspace owner if you believe this was a mistake.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your account in ${workspaceName} has been deactivated`,
            html,
        });
    }
    async notifyAddedToChannel(email, firstName, workspaceName, channelName, addedBy) {
        const subject = `Added to #${channelName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>You've been added to <strong>#${channelName}</strong> in ${workspaceName} by ${addedBy}.</p>
             <p>You can now view and participate in this channel.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `You've been added to #${channelName} in ${workspaceName}`,
            html,
        });
    }
    async notifyRemovedFromChannel(email, firstName, workspaceName, channelName, removedBy) {
        const subject = `Removed from #${channelName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>You've been removed from <strong>#${channelName}</strong> in ${workspaceName} by ${removedBy}.</p>
             <p>You no longer have access to this channel.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `You've been removed from #${channelName} in ${workspaceName}`,
            html,
        });
    }
    async sendPrivateChannelInvitation(email, firstName, workspaceName, channelName, inviterName, inviteLink) {
        const subject = `Invited to private channel #${channelName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>${inviterName} has invited you to join the private channel <strong>#${channelName}</strong> in ${workspaceName}.</p>
             <p style="margin:20px 0;">
               <a href="${inviteLink}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Join Channel
               </a>
             </p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `${inviterName} invited you to #${channelName} in ${workspaceName}`,
            html,
        });
    }
    async notifyGuestAccessGranted(email, firstName, workspaceName, grantedBy, limitations) {
        const subject = 'Guest Access Granted';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>You've been granted guest access to <strong>${workspaceName}</strong> by ${grantedBy}.</p>
             <p><strong>Access limitations:</strong></p>
             <p>${limitations}</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `You have guest access to ${workspaceName}`,
            html,
        });
    }
    async notifyGuestAccessRevoked(email, firstName, workspaceName, revokedBy) {
        const subject = 'Guest Access Revoked';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Your guest access to <strong>${workspaceName}</strong> has been revoked by ${revokedBy}.</p>
             <p>You no longer have access to this workspace.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your guest access to ${workspaceName} has been revoked`,
            html,
        });
    }
    async notifyDataExportReady(email, firstName, workspaceName, downloadLink, expiresIn) {
        const subject = 'Your Data Export is Ready';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Your data export for <strong>${workspaceName}</strong> is ready for download.</p>
             <p style="margin:20px 0;">
               <a href="${downloadLink}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Download Export
               </a>
             </p>
             <p>This download link will expire in ${expiresIn}.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your data export for ${workspaceName} is ready. Link: ${downloadLink}`,
            html,
        });
    }
    async notifyDataDeletionScheduled(email, firstName, workspaceName, deletionDate) {
        const subject = 'Data Deletion Scheduled';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Your data in <strong>${workspaceName}</strong> is scheduled for permanent deletion.</p>
             <p><strong>Deletion date:</strong> ${deletionDate}</p>
             <p>After this date, all your messages, files, and workspace data will be permanently removed and cannot be recovered.</p>
             <p>If you want to cancel this, please contact the workspace owner immediately.</p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Your data in ${workspaceName} will be deleted on ${deletionDate}`,
            html,
        });
    }
    async notifyPolicyUpdate(members, workspaceName, policyType, updateLink) {
        const subject = `${policyType} Updated`;
        await this.sendBatchEmails(members, subject, (member) => this.buildTemplate({
            title: subject,
            greeting: `Hi ${member.firstName || 'there'},`,
            body: `<p>The <strong>${policyType}</strong> for ${workspaceName} has been updated.</p>
               <p>Please review the changes at your earliest convenience.</p>
               <p style="margin:20px 0;">
                 <a href="${updateLink}" 
                    style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                   Review Changes
                 </a>
               </p>`,
            workspaceName,
        }), (member) => `${policyType} has been updated for ${workspaceName}. Review: ${updateLink}`);
    }
    async sendComplianceReportGenerated(email, firstName, workspaceName, reportLink) {
        const subject = 'Compliance Report Generated';
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>A compliance report for <strong>${workspaceName}</strong> has been generated.</p>
             <p style="margin:20px 0;">
               <a href="${reportLink}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 View Report
               </a>
             </p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Compliance report generated for ${workspaceName}. Link: ${reportLink}`,
            html,
        });
    }
    async sendDirectMessageNotification(email, firstName, workspaceName, senderName, messagePreview, messageLink) {
        const subject = `New message from ${senderName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p><strong>${senderName}</strong> sent you a message in ${workspaceName}:</p>
             <p style="background:#f9fafb; padding:15px; border-left:3px solid #4F46E5; margin:15px 0;">${messagePreview}</p>
             <p style="margin:20px 0;">
               <a href="${messageLink}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Reply
               </a>
             </p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `${senderName} sent you a message: ${messagePreview}`,
            html,
        });
    }
    async sendMentionNotification(email, firstName, workspaceName, channelName, mentionedBy, messagePreview, messageLink) {
        const subject = `${mentionedBy} mentioned you in #${channelName}`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p><strong>${mentionedBy}</strong> mentioned you in <strong>#${channelName}</strong>:</p>
             <p style="background:#f9fafb; padding:15px; border-left:3px solid #4F46E5; margin:15px 0;">${messagePreview}</p>
             <p style="margin:20px 0;">
               <a href="${messageLink}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 View Message
               </a>
             </p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `${mentionedBy} mentioned you in #${channelName}: ${messagePreview}`,
            html,
        });
    }
    async sendActivityDigest(email, firstName, workspaceName, digest, digestLink) {
        const subject = `Your ${workspaceName} activity summary`;
        const html = this.buildTemplate({
            title: subject,
            greeting: `Hi ${firstName},`,
            body: `<p>Here's what you missed in <strong>${workspaceName}</strong>:</p>
             <ul style="list-style:none; padding:0;">
               <li style="margin:10px 0;">📬 <strong>${digest.unreadMessages}</strong> unread messages</li>
               <li style="margin:10px 0;">@️ <strong>${digest.mentions}</strong> mentions</li>
               <li style="margin:10px 0;">👥 <strong>${digest.newMembers}</strong> new members</li>
             </ul>
             <p style="margin:20px 0;">
               <a href="${digestLink}" 
                  style="background:#4F46E5; color:#fff; padding:12px 24px; border-radius:5px; text-decoration:none; display:inline-block;">
                 Catch Up
               </a>
             </p>`,
            workspaceName,
        });
        await this.sendEmail({
            to: email,
            subject,
            text: `Activity summary for ${workspaceName}: ${digest.unreadMessages} unread, ${digest.mentions} mentions, ${digest.newMembers} new members`,
            html,
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map