export declare class RegisterDto {
    fullName: string;
    phoneNumber: string;
    email: string;
    password: string;
    confirmPassword: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class VerifyEmailDTO {
    emailCode: string;
}
export declare class RequestResetPasswordDTO {
    email: string;
}
export declare class ResetPasswordDTO {
    email: string;
    passwordResetCode: string;
    newPassword: string;
    confirmNewPassword: string;
}
export declare class ChangePasswordDTO {
    password: string;
    newPassword: string;
    confirmNewPassword: string;
}
export declare class SelectWorkspaceDTO {
    workspaceId: string;
}
