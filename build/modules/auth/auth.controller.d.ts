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
        workspace: import("../workspaces/entities/workspace.entity").Workspace;
        message: string;
    }>;
}
