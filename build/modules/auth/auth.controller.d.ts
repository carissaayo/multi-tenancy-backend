import { ChangePasswordDTO, LoginDto, RegisterDto, RequestResetPasswordDTO, ResetPasswordDTO, SelectWorkspaceDTO, VerifyEmailDTO } from './auth.dto';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        message: string;
        emailCode: string | null;
    }>;
    login(loginDto: LoginDto, req: AuthenticatedRequest): Promise<{
        profile: Partial<import("../users/entities/user.entity").User>;
        message: string;
        accessToken: string;
        refreshToken?: string;
    }>;
    verifyEmail(verifyEmailDto: VerifyEmailDTO, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    resendVerificationEmail(req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    passwordResetRequest(resetPasswordDto: RequestResetPasswordDTO): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDTO): Promise<{
        message: string;
    }>;
    changePassword(changePasswordDto: ChangePasswordDTO, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    selectWorkspace(selectWorkspaceDto: SelectWorkspaceDTO, req: AuthenticatedRequest): Promise<{
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
            creator: import("../users/entities/user.entity").User;
            ownerId: string;
            owner: import("../users/entities/user.entity").User;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date;
        };
        message: string;
    }>;
    logout(req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    logoutAll(req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
}
