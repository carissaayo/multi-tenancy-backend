// src/config/configuration.ts
import { envSchema, validateEnv, EnvVars } from './config.validation';

const config=() => {
  // Validate and parse environment variables
  const validatedEnv = validateEnv(process.env);

  return {
    app: {
      nodeEnv: validatedEnv.NODE_ENV,
      port: validatedEnv.PORT,
      name: validatedEnv.APP_NAME,
      //   url: validatedEnv.APP_URL,
    },

    database: {
      host: validatedEnv.DB_HOST,
      port: validatedEnv.DB_PORT,
      username: validatedEnv.DB_USER,
      password: validatedEnv.DB_PASSWORD,
      database: validatedEnv.DB_NAME,
    },

  
  };
};
export default config;
// Export type for type-safe config access
export type Config = ReturnType<typeof config>;

// Re-export for convenience
export type { EnvVars } from './config.validation';
