import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';


@Entity({ name: 'refresh_tokens', schema: 'public' })
@Index(['tokenHash'])
@Index(['user'])
@Index(['isRevoked'])
@Index(['expiresAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500, name: 'token_hash' })
  tokenHash: string;

  /**
   * Owning user
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  /**
   * Expiry
   */
  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  /**
   * Usage tracking
   */
  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt: Date | null;

  /**
   * Revocation
   */
  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  isRevoked: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'revoked_at' })
  revokedAt: Date | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'revoked_reason',
  })
  revokedReason: string | null;

  /**
   * Metadata
   */
  @Column({ type: 'varchar', length: 500, default: '', name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, default: '', name: 'ip_address' })
  ipAddress: string;

  /**
   * Token rotation version
   */
  @Column({ type: 'int', default: 0 })
  version: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
