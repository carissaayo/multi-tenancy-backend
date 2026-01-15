import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MigrationRunnerService implements OnModuleInit {
  private readonly logger = new Logger(MigrationRunnerService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    if (process.env.RUN_MIGRATIONS !== 'true') {
      this.logger.log('Migration runner skipped');
      return;
    }

    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }

    this.logger.log('Running database migrations...');
    await this.dataSource.runMigrations();
    this.logger.log('Database migrations completed');
  }
}
