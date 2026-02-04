import { User } from '../../users/entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkspaceInvitationRole, WorkspaceInvitationStatus } from '../interfaces/workspace.interface';



@Entity({ name: 'workspace_invitations', schema: 'public' })
@Index(['token'], { unique: true })
@Index(['workspaceId', 'email'])
@Index(['expiresAt'])
@Index(['status'])
@Index(['workspaceId', 'email', 'status'], { unique: true })
export class WorkspaceInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // -------------------------
  // Workspace relationship
  // -------------------------
  @Column({ type: 'uuid', name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  // -------------------------
  // Invitation target
  // -------------------------
  @Column({ type: 'text' })
  email: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: WorkspaceInvitationRole.MEMBER,
  })
  role: WorkspaceInvitationRole;

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

  @Column({ type: 'uuid', name: 'sent_to', nullable: true })
  sentToId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sent_to' })
  sentTo: User | null;

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
