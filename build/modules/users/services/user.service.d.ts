import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { CreateUserDto, UpdateUserDto } from "../dtos/user.dto";
import { AuthenticatedRequest } from "src/core/security/interfaces/custom-request.interface";
import { AWSStorageService } from "src/core/storage/services/aws-storage.service";
export declare class UsersService {
    private readonly userRepo;
    private readonly storageService;
    private readonly logger;
    constructor(userRepo: Repository<User>, storageService: AWSStorageService);
    private generateUniqueUserName;
    create(dto: CreateUserDto): Promise<User>;
    updateUser(req: AuthenticatedRequest, updateDto: UpdateUserDto): Promise<{
        user: Partial<User>;
        message: string;
    }>;
    updateUserAvatar(req: AuthenticatedRequest, file: Express.Multer.File): Promise<{
        user: Partial<User>;
        message: string;
    }>;
    getUser(req: AuthenticatedRequest): Promise<{
        user: Partial<User>;
        message: string;
    }>;
    validateCredentials(email: string, password: string): Promise<User>;
    updateLastLogin(userId: string): Promise<void>;
    findById(id: string): Promise<User | null>;
    getUserProfile(user: User): Partial<User>;
}
