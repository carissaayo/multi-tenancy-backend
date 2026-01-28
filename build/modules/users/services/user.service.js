"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../entities/user.entity");
const typeorm_2 = require("typeorm");
const custom_errors_1 = require("../../../core/error-handler/custom-errors");
const aws_storage_service_1 = require("../../../core/storage/services/aws-storage.service");
let UsersService = UsersService_1 = class UsersService {
    userRepo;
    storageService;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(userRepo, storageService) {
        this.userRepo = userRepo;
        this.storageService = storageService;
    }
    async generateUniqueUserName(fullName) {
        if (!fullName) {
            return null;
        }
        let baseUserName = fullName.replace(/\s+/g, '').toLowerCase();
        let userName = baseUserName;
        let counter = 1;
        while (true) {
            const existingUser = await this.userRepo.findOne({
                where: { userName },
            });
            if (!existingUser) {
                break;
            }
            userName = `${baseUserName}${counter}`;
            counter++;
        }
        return userName;
    }
    async create(dto) {
        const existing = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (existing) {
            throw custom_errors_1.customError.badRequest('Email already registered');
        }
        const passwordHash = await bcryptjs_1.default.hash(dto.password, 12);
        const userName = await this.generateUniqueUserName(dto.fullName);
        const user = this.userRepo.create({
            email: dto.email.toLowerCase(),
            passwordHash,
            fullName: dto.fullName,
            userName,
        });
        return this.userRepo.save(user);
    }
    async updateUser(req, updateDto) {
        const user = await this.userRepo.findOne({ where: { id: req.userId } });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        if (!user.isActive) {
            throw custom_errors_1.customError.forbidden('Your account is suspended, reach out to support for assistance');
        }
        if (updateDto.fullName !== undefined)
            user.fullName = updateDto.fullName;
        if (updateDto.phoneNumber !== undefined)
            user.phoneNumber = updateDto.phoneNumber;
        if (updateDto.bio !== undefined)
            user.bio = updateDto.bio;
        if (updateDto.city !== undefined)
            user.city = updateDto.city;
        if (updateDto.state !== undefined)
            user.state = updateDto.state;
        if (updateDto.country !== undefined)
            user.country = updateDto.country;
        const updatedUser = await this.userRepo.save(user);
        const normalizedUser = this.getUserProfile(updatedUser);
        return {
            user: normalizedUser,
            message: 'User updated successfully',
        };
    }
    async updateUserAvatar(req, file) {
        const user = await this.userRepo.findOne({ where: { id: req.userId } });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        if (user.avatarUrl) {
            try {
                const oldKey = this.storageService.parseS3Url(user.avatarUrl);
                await this.storageService.deleteFile(oldKey, { scope: 'user', userId: user.id });
            }
            catch (error) {
                this.logger.warn(`Failed to delete old avatar for user ${user.id}: ${error.message}`);
            }
        }
        const uploadedFile = await this.storageService.uploadFile(file, {
            scope: 'user',
            userId: user.id,
            folder: 'avatars',
            makePublic: true,
        });
        user.avatarUrl = uploadedFile.url;
        user.updatedAt = new Date();
        await this.userRepo.save(user);
        this.logger.log(`Avatar updated: ${user.id} by user ${user.id}`);
        const updatedUser = await this.userRepo.findOne({ where: { id: user.id } });
        if (!updatedUser) {
            throw custom_errors_1.customError.notFound('Avatar has been updated successfully but failed to fetch the updated user profile');
        }
        const normalizedUser = this.getUserProfile(updatedUser);
        return {
            user: normalizedUser,
            message: 'Avatar has been updated successfully',
        };
    }
    async getUser(req) {
        const user = await this.userRepo.findOne({ where: { id: req.userId } });
        if (!user) {
            throw custom_errors_1.customError.notFound('User not found');
        }
        console.log(user.email, 'email');
        if (!user.isActive) {
            throw custom_errors_1.customError.forbidden('Your account is suspended, reach out to support for assistance');
        }
        const normalizedUser = this.getUserProfile(user);
        return {
            user: normalizedUser,
            message: 'User retrieved successfully',
        };
    }
    async validateCredentials(email, password) {
        const user = await this.userRepo.findOne({
            where: { email: email.toLowerCase(), isActive: true },
        });
        if (!user) {
            throw custom_errors_1.customError.unauthorized('Invalid credentials');
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw custom_errors_1.customError.unauthorized('Invalid credentials');
        }
        return user;
    }
    async updateLastLogin(userId) {
        await this.userRepo.update(userId, {
            lastLoginAt: new Date(),
        });
    }
    async findById(id) {
        return this.userRepo.findOne({ where: { id } });
    }
    getUserProfile(user) {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            city: user.city,
            state: user.state,
            country: user.country,
            isEmailVerified: user.isEmailVerified,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            userName: user.userName
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        aws_storage_service_1.AWSStorageService])
], UsersService);
//# sourceMappingURL=user.service.js.map