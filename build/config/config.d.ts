declare const config: () => {
    app: {
        nodeEnv: "production" | "development" | "test" | "staging";
        port: number;
        name: string;
    };
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    jwt: {
        access_token_secret: string;
        refresh_token_secret: string;
        duration10m: string;
        duration1h: string;
        duration1d: string;
        duration7d: string;
    };
    aws: {
        region: string | undefined;
        access_key_id: string | undefined;
        secret_access_key: string | undefined;
        bucket_name: string | undefined;
    };
    frontend: {
        url: string;
    };
    workspace: {
        maxFreeWorkspaces: number;
    };
};
export default config;
export type Config = ReturnType<typeof config>;
