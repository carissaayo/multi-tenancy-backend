"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MigrationRunnerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRunnerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
let MigrationRunnerService = MigrationRunnerService_1 = class MigrationRunnerService {
    dataSource;
    logger = new common_1.Logger(MigrationRunnerService_1.name);
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        if (process.env.RUN_MIGRATIONS !== 'true') {
            this.logger.log('Migration runner skipped (RUN_MIGRATIONS not set to true)');
            return;
        }
        try {
            if (!this.dataSource.isInitialized) {
                this.logger.log('Initializing database connection...');
                await this.dataSource.initialize();
            }
            this.logger.log('Running database migrations...');
            await this.dataSource.runMigrations();
            this.logger.log('✅ Database migrations completed successfully');
        }
        catch (error) {
            this.logger.error('❌ Failed to run migrations:', error.message);
            this.logger.error(error.stack);
            if (process.env.NODE_ENV === 'production') {
                throw error;
            }
        }
    }
};
exports.MigrationRunnerService = MigrationRunnerService;
exports.MigrationRunnerService = MigrationRunnerService = MigrationRunnerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], MigrationRunnerService);
//# sourceMappingURL=migration-runner.service.js.map