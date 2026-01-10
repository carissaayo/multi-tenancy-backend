import { Injectable } from "@nestjs/common";
import bcrypt from 'bcryptjs';
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { customError } from "src/core/error-handler/custom-errors";
import { CreateUserDto, UpdateUserDto } from "../dtos/user.dto";
import { AuthenticatedRequest } from "src/core/security/interfaces/custom-request.interface";
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
