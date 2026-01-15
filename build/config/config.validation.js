"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test', 'staging'])
        .default('development'),
    PORT: zod_1.z.string().regex(/^\d+$/, 'PORT must be a number').transform(Number),
    APP_NAME: zod_1.z.string().min(1, 'APP_NAME is required'),
    DB_HOST: zod_1.z.string().min(1, 'DB_HOST is required'),
    DB_PORT: zod_1.z
        .string()
        .regex(/^\d+$/, 'DB_PORT must be a number')
        .transform(Number),
    DB_USER: zod_1.z.string().min(1, 'DB_USER is required'),
    DB_PASSWORD: zod_1.z.string().min(1, 'DB_PASSWORD is required'),
    DB_NAME: zod_1.z.string().min(1, 'DB_NAME is required'),
    ACCESS_TOKEN_SECRET: zod_1.z.string().min(1, 'ACCESS_TOKEN_SECRET is required'),
    REFRESH_TOKEN_SECRET: zod_1.z.string().min(1, 'REFRESH_TOKEN_SECRET is required'),
    JWT_DURATION_10M: zod_1.z.string().min(1, 'JWT_DURATION_10M is required'),
    JWT_DURATION_1H: zod_1.z.string().min(1, 'JWT_DURATION_1H is required'),
    JWT_DURATION_1D: zod_1.z.string().min(1, 'JWT_DURATION_1D is required'),
    JWT_DURATION_7D: zod_1.z.string().min(1, 'JWT_DURATION_7D is required'),
    AWS_REGION: zod_1.z.string().min(1, 'AWS_REGION is required'),
    AWS_ACCESS_KEY_ID: zod_1.z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
    AWS_BUCKET_NAME: zod_1.z.string().min(1, 'AWS_BUCKET_NAME is required'),
    FRONTEND_URL: zod_1.z.string().min(1, 'FRONTEND_URL is required'),
    MAX_FREE_WORKSPACES: zod_1.z.string().regex(/^\d+$/, 'MAX_FREE_WORKSPACES must be a number').transform(Number),
});
function validateEnv(config) {
    try {
        return exports.envSchema.parse(config);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.issues
                .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                .join('\n');
            throw new Error(`Environment validation failed:\n${missingVars}\n\nPlease check your .env file.`);
        }
        throw error;
    }
}
//# sourceMappingURL=config.validation.js.map