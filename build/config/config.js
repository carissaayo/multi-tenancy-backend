"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getEnvVar(key) {
    return process.env[key];
}
function requireEnvVar(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Required environment variable ${key} is missing`);
    }
    return value;
}
const config = () => {
    return {
        app: {
            nodeEnv: getEnvVar('NODE_ENV') || 'development',
            port: parseInt(getEnvVar('PORT')?.toString() || '8000', 10),
            name: requireEnvVar('APP_NAME'),
        },
        database: {
            host: requireEnvVar('DB_HOST'),
            port: parseInt(getEnvVar('DB_PORT')?.toString() || '5432', 10),
            username: requireEnvVar('DB_USER'),
            password: requireEnvVar('DB_PASSWORD'),
            database: requireEnvVar('DB_NAME'),
        },
        jwt: {
            access_token_secret: requireEnvVar('ACCESS_TOKEN_SECRET'),
            refresh_token_secret: requireEnvVar('REFRESH_TOKEN_SECRET'),
            duration10m: requireEnvVar('JWT_DURATION_10M'),
            duration1h: requireEnvVar('JWT_DURATION_1H'),
            duration1d: requireEnvVar('JWT_DURATION_1D'),
            duration7d: requireEnvVar('JWT_DURATION_7D'),
        },
        aws: {
            region: getEnvVar('AWS_REGION'),
            access_key_id: getEnvVar('AWS_ACCESS_KEY_ID'),
            secret_access_key: getEnvVar('AWS_SECRET_ACCESS_KEY'),
            bucket_name: getEnvVar('AWS_BUCKET_NAME'),
        },
        frontend: {
            url: getEnvVar('FRONTEND_URL') || 'http://localhost:8000',
        },
        workspace: {
            maxFreeWorkspaces: parseInt(getEnvVar('MAX_FREE_WORKSPACES')?.toString() || '2', 10),
        },
    };
};
exports.default = config;
//# sourceMappingURL=config.js.map