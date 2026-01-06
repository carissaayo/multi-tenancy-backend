import { Injectable } from "@nestjs/common";
import bcrypt from 'bcryptjs';
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { customError } from "src/core/error-handler/custom-errors";
import { CreateUserDto } from "../user.dto";
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
}
