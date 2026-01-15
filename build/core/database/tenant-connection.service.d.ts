import { DataSource } from 'typeorm';
import type { Request } from 'express';
export declare class TenantConnectionService {
    private readonly dataSource;
    private readonly request;
    private currentSchema;
    constructor(dataSource: DataSource, request: Request);
    setSchema(workspaceSlug: string): void;
    getSchema(): string;
    query<T = any>(sql: string, parameters?: any[]): Promise<T>;
    switchToTenantSchema(): Promise<void>;
    createWorkspaceSchema(workspaceSlug: string): Promise<void>;
    private createTenantTables;
    dropWorkspaceSchema(workspaceSlug: string): Promise<void>;
}
