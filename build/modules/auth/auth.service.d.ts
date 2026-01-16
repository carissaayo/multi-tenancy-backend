import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { TokenManager } from 'src/core/security/services/token-manager.service';
import { ChangePasswordDTO, LoginDto, RegisterDto, RequestResetPasswordDTO, ResetPasswordDTO, SelectWorkspaceDTO, VerifyEmailDTO } from './auth.dto';
import { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { UsersService } from '../users/services/user.service';
import { MemberService } from '../members/services/member.service';
import { EmailService } from 'src/core/email/services/email.service';
import { Workspace } from '../workspaces/entities/workspace.entity';
export declare class AuthService {
    private readonly userRepo;
    private readonly workspaceRepo;
    private readonly userService;
    private readonly memberService;
    private readonly tokenManager;
    private readonly emailService;
    constructor(userRepo: Repository<User>, workspaceRepo: Repository<Workspace>, userService: UsersService, memberService: MemberService, tokenManager: TokenManager, emailService: EmailService);
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
        workspace: Workspace;
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
}
