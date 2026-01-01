import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workspace } from '../../../modules/workspaces/entities/workspace.entity';

@Entity({ name: 'usage_metrics', schema: 'public' })
export class UsageMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'varchar', length: 50, name: 'metric_type' })
  metricType: string; // 'api_calls', 'storage_gb', 'messages', 'active_users'

  @Column({ type: 'bigint', default: 0 })
  value: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  period: string; // '2025-12'

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
