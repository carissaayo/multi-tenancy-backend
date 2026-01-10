import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users', schema: 'public' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'full_name' })
  fullName: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    unique: true,
    name: 'phone_number',
  })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'bio' })
  bio: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'street' })
  street: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'city' })
  city: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'state' })
  state: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'country' })
  country: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatarUrl: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email_code' })
  emailCode: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
  @Column({ type: 'timestamp', nullable: true, name: 'lock_until' })
  lockUntil: Date | null;

  @Column({ type: 'int', default: 0, name: 'failed_login_attempts' })
  failedLoginAttempts: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'password_reset_code',
  })
  passwordResetCode: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'reset_password_expires' })
  resetPasswordExpires: Date | null;
}
