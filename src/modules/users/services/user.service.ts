import { Injectable, Logger } from "@nestjs/common";
import bcrypt from 'bcryptjs';
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { customError } from "src/core/error-handler/custom-errors";
import { CreateUserDto, UpdateUserDto } from "../dtos/user.dto";
import { AuthenticatedRequest } from "src/core/security/interfaces/custom-request.interface";
import { AWSStorageService } from "src/core/storage/services/aws-storage.service";
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly storageService: AWSStorageService,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw customError.badRequest('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
    });

    return this.userRepo.save(user);
  }

  async updateUser(
    req: AuthenticatedRequest,
    updateDto: UpdateUserDto,
  ): Promise<{ user: Partial<User>; message: string }> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    if (!user.isActive) {
      throw customError.forbidden(
        'Your account is suspended, reach out to support for assistance',
      );
    }

    if (updateDto.fullName !== undefined) user.fullName = updateDto.fullName;
    if (updateDto.phoneNumber !== undefined)
      user.phoneNumber = updateDto.phoneNumber;
    if (updateDto.bio !== undefined) user.bio = updateDto.bio;
    if (updateDto.city !== undefined) user.city = updateDto.city;
    if (updateDto.state !== undefined) user.state = updateDto.state;
    if (updateDto.country !== undefined) user.country = updateDto.country;

    const updatedUser = await this.userRepo.save(user);
    const normalizedUser = this.getUserProfile(updatedUser);
    return {
      user: normalizedUser,
      message: 'User updated successfully',
    };
  }

  async updateUserAvatar(
    req: AuthenticatedRequest,
    file: Express.Multer.File,
  ): Promise<{ user: Partial<User>; message: string }> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    // Delete old avatar if exists
    if (  user.avatarUrl) {
      try {
        const oldKey = this.storageService.parseS3Url(user.avatarUrl);
        await this.storageService.deleteFile(oldKey, user.id);
      } catch (error) {
        this.logger.warn(
          `Failed to delete old avatar for user ${user.id}: ${error.message}`,
        );
      }
    }
    // Upload new logo to S3
    const uploadedFile = await this.storageService.uploadFile(file, {
      userId: user.id,
      folder: 'avatars',
      maxSizeInMB: 5,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/gif',
        'image/webp',
      ],
      makePublic: true,
    });
    // Update workspace with new logo URL
    user.avatarUrl = uploadedFile.url;
    user.updatedAt = new Date();

    await this.userRepo.save(user);

    this.logger.log(
      `Avatar updated: ${user.id} by user ${user.id}`,
    );

    // Return workspace with safe user fields
    const updatedUser =
      await this.userRepo.findOne({ where: { id: user.id } });
    if (!updatedUser) {
      throw customError.notFound('Avatar has been updated successfully but failed to fetch the updated user profile');
    }

    const normalizedUser = this.getUserProfile(updatedUser);
    return {
      user: normalizedUser,
      message: 'Avatar has beenupdated successfully',
    };
  }
  async getUser(
    req: AuthenticatedRequest,
  ): Promise<{ user: Partial<User>; message: string }> {
    const user = await this.userRepo.findOne({ where: { id: req.userId } });
    if (!user) {
      throw customError.notFound('User not found');
    }

    console.log(user.email, 'email');
    if (!user.isActive) {
      throw customError.forbidden(
        'Your account is suspended, reach out to support for assistance',
      );
    }
    const normalizedUser = this.getUserProfile(user);
    return {
      user: normalizedUser,
      message: 'User retrieved successfully',
    };
  }

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase(), isActive: true },
    });

    if (!user) {
      throw customError.unauthorized('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw customError.unauthorized('Invalid credentials');
    }

    return user;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepo.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  getUserProfile(user: User): Partial<User> {
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
    };
  }
}
