import { Workspace } from '../../modules/workspaces/workspace.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';


@Entity({ name: 'feature_flags', schema: 'public' })
@Unique(['workspaceId', 'featureKey'])
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'workspace_id' })
  workspaceId: string;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'varchar', length: 100, name: 'feature_key' })
  featureKey: string;

  @Column({ type: 'boolean', default: false, name: 'is_enabled' })
  isEnabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
