import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MigrationRunnerService implements OnModuleInit {
  private readonly logger = new Logger(MigrationRunnerService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    if (process.env.RUN_MIGRATIONS !== 'true') {
      this.logger.log(
        'Migration runner skipped (RUN_MIGRATIONS not set to true)',
      );
      return;
    }

    try {
      // Wait for connection to be established
      if (!this.dataSource.isInitialized) {
        this.logger.log('Initializing database connection...');
        await this.dataSource.initialize();
      }

      this.logger.log('Running database migrations...');
      await this.dataSource.runMigrations();
      this.logger.log('✅ Database migrations completed successfully');
    } catch (error) {
      this.logger.error('❌ Failed to run migrations:', error.message);
      this.logger.error(error.stack);
      // Don't throw - let the app continue, but log the error
      // In production, you might want to throw to prevent app startup
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}
