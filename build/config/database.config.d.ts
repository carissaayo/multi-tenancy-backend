export declare const databaseConfig: (() => {
    type: string;
    url: string;
    ssl: {
        rejectUnauthorized: boolean;
    };
    entities: string[];
    migrations: string[];
    synchronize: boolean;
    logging: boolean;
    host?: undefined;
    port?: undefined;
    username?: undefined;
    password?: undefined;
    database?: undefined;
} | {
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
    entities: string[];
    migrations: string[];
    synchronize: boolean;
    logging: boolean;
    url?: undefined;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    type: string;
    url: string;
    ssl: {
        rejectUnauthorized: boolean;
    };
    entities: string[];
    migrations: string[];
    synchronize: boolean;
    logging: boolean;
    host?: undefined;
    port?: undefined;
    username?: undefined;
    password?: undefined;
    database?: undefined;
} | {
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
    entities: string[];
    migrations: string[];
    synchronize: boolean;
    logging: boolean;
    url?: undefined;
}>;
