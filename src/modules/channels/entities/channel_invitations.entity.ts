import { User } from '../../users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkspaceInvitationStatus } from '../../workspaces/interfaces/workspace.interface';

@Entity({ name: 'channel_invitations', schema: 'public' })
@Index(['token'], { unique: true })
@Index(['channelId', 'memberId'])
@Index(['expiresAt'])
@Index(['status'])
@Index(['channelId', 'memberId', 'status'], { unique: true })
export class ChannelInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // -------------------------
  // Channel relationship
  // Note: Channels are stored in workspace schemas, so we can't use a foreign key
  // -------------------------
  @Column({ type: 'uuid', name: 'channel_id' })
  channelId: string;

  // -------------------------
  // Workspace relationship (for easier querying)
  // -------------------------
  @Column({ type: 'uuid', name: 'workspace_id' })
  workspaceId: string;

  // -------------------------
  // Invitation target (workspace member being invited)
  // -------------------------
  @Column({ type: 'uuid', name: 'member_id' })
  memberId: string;

  // -------------------------
  // Invitation metadata
  // -------------------------
  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'uuid', name: 'invited_by', nullable: true })
  invitedBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invited_by' })
  inviter: User | null;

  @CreateDateColumn({ type: 'timestamp', name: 'invited_at' })
  invitedAt: Date;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  // -------------------------
  // Acceptance tracking
  // -------------------------
  @Column({ type: 'timestamp', name: 'accepted_at', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'uuid', name: 'accepted_by', nullable: true })
  acceptedBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'accepted_by' })
  acceptedByUser: User | null;

  // -------------------------
  // Revocation tracking
  // -------------------------
  @Column({ type: 'timestamp', name: 'revoked_at', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'uuid', name: 'revoked_by', nullable: true })
  revokedBy: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'revoked_by' })
  revokedByUser: User | null;

  // -------------------------
  // Status & message
  // -------------------------
  @Column({
    type: 'varchar',
    length: 20,
    default: WorkspaceInvitationStatus.PENDING,
  })
  status: WorkspaceInvitationStatus;

  @Column({ type: 'text', nullable: true })
  message: string | null;
}
