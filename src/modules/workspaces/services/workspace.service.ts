import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { customError } from 'src/core/error-handler/custom-errors';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  async findById(id: string): Promise<Workspace | null> {
    return this.workspaceRepo.findOne({
      where: { id, isActive: true },
    });
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.workspaceRepo.findOne({
      where: { slug, isActive: true },
    });
  }

  async create(data: {
    name: string;
    slug: string;
    createdBy: string;
    description?: string;
  }): Promise<Workspace> {
    const existing = await this.workspaceRepo.findOne({
      where: { slug: data.slug },
    });

    if (existing) {
      throw customError.badRequest('Workspace slug already exists');
    }

    const workspace = this.workspaceRepo.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdBy: data.createdBy,
    });

    return this.workspaceRepo.save(workspace);
  }

  async update(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const workspace = await this.findById(id);

    if (!workspace) {
      throw customError.notFound('Workspace not found');
    }

    Object.assign(workspace, updates);
    return this.workspaceRepo.save(workspace);
  }
}
