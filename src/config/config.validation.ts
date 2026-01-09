// src/config/env.validation.ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'staging'])
    .default('development'),

  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').transform(Number),

  APP_NAME: z.string().min(1, 'APP_NAME is required'),

  //   APP_URL: z.string().url('APP_URL must be a valid URL'),

  DB_HOST: z.string().min(1, 'DB_HOST is required'),

  DB_PORT: z
    .string()
    .regex(/^\d+$/, 'DB_PORT must be a number')
    .transform(Number),

  DB_USER: z.string().min(1, 'DB_USER is required'),

  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),

  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'ACCESS_TOKEN_SECRET is required'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'REFRESH_TOKEN_SECRET is required'),
  JWT_DURATION_10M: z.string().min(1, 'JWT_DURATION_10M is required'),
  JWT_DURATION_1H: z.string().min(1, 'JWT_DURATION_1H is required'),
  JWT_DURATION_1D: z.string().min(1, 'JWT_DURATION_1D is required'),
  JWT_DURATION_7D: z.string().min(1, 'JWT_DURATION_7D is required'),
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_BUCKET_NAME: z.string().min(1, 'AWS_BUCKET_NAME is required'),
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL is required'),
});

// Infer the TypeScript type from the schema
export type EnvVars = z.infer<typeof envSchema>;

// Validation function
export function validateEnv(config: Record<string, unknown>): EnvVars {
  try {
    return envSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
     const missingVars = error.issues
       .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
       .join('\n');


      throw new Error(
        `Environment validation failed:\n${missingVars}\n\nPlease check your .env file.`,
      );
    }
    throw error;
  }
}
