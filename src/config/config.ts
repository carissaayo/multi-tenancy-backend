const config = () => {
  return {
    app: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '8000', 10),
      name: process.env.APP_NAME || 'App',
    },
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'multi_tenancy',
    },
    jwt: {
      access_token_secret: process.env.ACCESS_TOKEN_SECRET || 'change-me',
      refresh_token_secret: process.env.REFRESH_TOKEN_SECRET || 'change-me',
      duration10m: process.env.JWT_DURATION_10M || '10m',
      duration1h: process.env.JWT_DURATION_1H || '1h',
      duration1d: process.env.JWT_DURATION_1D || '1d',
      duration7d: process.env.JWT_DURATION_7D || '7d',
    },
    aws: {
      region: process.env.AWS_REGION,
      access_key_id: process.env.AWS_ACCESS_KEY_ID,
      secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
      bucket_name: process.env.AWS_BUCKET_NAME,
    },
  };
};

export default config;
export type Config = ReturnType<typeof config>;
