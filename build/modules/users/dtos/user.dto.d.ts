export declare class CreateUserDto {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
}
export declare class UpdateUserDto {
    fullName?: string;
    phoneNumber?: string;
    bio?: string;
    city?: string;
    state?: string;
    country?: string;
}
