import { Repository } from 'typeorm';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { UsersService } from '../users/services/user.service';
import { MemberService } from '../members/services/member.service';
import { EmailService } from 'src/core/email/services/email.service';
import { WorkspaceQueryService } from '../workspaces/services/workspace-query.service';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { ChangePasswordDTO, LoginDto, RegisterDto, RequestResetPasswordDTO, ResetPasswordDTO, SelectWorkspaceDTO, VerifyEmailDTO } from './auth.dto';
export declare class AuthService {
    private readonly userRepo;
    private readonly workspaceRepo;
    private readonly userService;
    private readonly memberService;
    private readonly tokenManager;
    private readonly emailService;
    private readonly workspaceQueryService;
    constructor(userRepo: Repository<User>, workspaceRepo: Repository<Workspace>, userService: UsersService, memberService: MemberService, tokenManager: TokenManager, emailService: EmailService, workspaceQueryService: WorkspaceQueryService);
    private generateUniqueUserName;
    register(dto: RegisterDto): Promise<{
        message: string;
        emailCode: string | null;
    }>;
    login(dto: LoginDto, req: AuthenticatedRequest): Promise<{
        profile: Partial<User>;
        message: string;
        accessToken: string;
        refreshToken?: string;
    }>;
    selectWorkspace(dto: SelectWorkspaceDTO, req: AuthenticatedRequest): Promise<{
        accessToken: string;
        workspace: {
            membersCount: number;
            channelCount: number;
            userRole: "member" | "admin" | "guest" | "owner";
            id: string;
            slug: string;
            name: string;
            description: string;
            logoUrl: string;
            plan: import("../workspaces/interfaces/workspace.interface").WorkspacePlan;
            isActive: boolean;
            settings: Record<string, any>;
            createdBy: string;
            creator: User;
            ownerId: string;
            owner: User;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date;
        };
        message: string;
    }>;
    private validatePassword;
    verifyEmail(dto: VerifyEmailDTO, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    resendVerificationEmail(req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    requestResetPassword(dto: RequestResetPasswordDTO): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDTO): Promise<{
        message: string;
    }>;
    changePassword(dto: ChangePasswordDTO, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    logout(req: AuthenticatedRequest, logoutFromAllDevices?: boolean): Promise<{
        message: string;
    }>;
}
