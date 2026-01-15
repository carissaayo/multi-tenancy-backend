import { UsersService } from '../services/user.service';
import type { AuthenticatedRequest } from 'src/core/security/interfaces/custom-request.interface';
import { UpdateUserDto } from '../dtos/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    updateUser(req: AuthenticatedRequest, updateUserDto: UpdateUserDto): Promise<{
        user: Partial<import("../entities/user.entity").User>;
        message: string;
    }>;
    getUser(req: AuthenticatedRequest): Promise<{
        user: Partial<import("../entities/user.entity").User>;
        message: string;
    }>;
    updateAvatar(req: AuthenticatedRequest, file: Express.Multer.File): Promise<{
        user: Partial<import("../entities/user.entity").User>;
        message: string;
    }>;
}
