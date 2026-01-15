export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string | null;
    phoneNumber: string | null;
    bio: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    avatarUrl: string | null;
    emailCode: string | null;
    isEmailVerified: boolean;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lockUntil: Date | null;
    failedLoginAttempts: number;
    passwordResetCode: string | null;
    resetPasswordExpires: Date | null;
}
