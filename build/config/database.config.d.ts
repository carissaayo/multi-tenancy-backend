export declare const databaseConfig: (() => {
    type: string;
    url: string | undefined;
    ssl: boolean | {
        rejectUnauthorized: boolean;
    };
    entities: string[];
    migrations: string[];
    synchronize: boolean;
    logging: boolean;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    type: string;
    url: string | undefined;
    ssl: boolean | {
        rejectUnauthorized: boolean;
    };
    entities: string[];
    migrations: string[];
    synchronize: boolean;
    logging: boolean;
}>;
