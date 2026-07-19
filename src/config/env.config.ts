import dotenv from "dotenv";

dotenv.config();

type EnvConfig = {
    /**
     * Application Configurations
     */
    PORT: number;
    NODE_ENV: "development" | "production";

    /**
     * AWS Configurations
     */
    AWS_ACCESS_KEY: string;
    AWS_SECRET_KEY: string;
    AWS_REGION: string;
    AWS_BUCKET_NAME: string;

    /**
     * Email Configurations
     */
    EMAIL_DOMAIN: string;
    SES_FROM_EMAIL: string;

    /**
     * SUPABASE Database URLs
     */
    SUPABASE_DEVELOPMENT_DATABASE_URL: string;
    SUPABASE_PRODUCTION_DATABASE_URL: string;
};

const requiredEnv = (key: string, value?: string): string => {
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
};

export const envConfig: EnvConfig = {

    PORT: Number(process.env.PORT),
    NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]),

    AWS_ACCESS_KEY: (process.env.AWS_ACCESS_KEY as EnvConfig["AWS_ACCESS_KEY"]),
    AWS_SECRET_KEY: (process.env.AWS_SECRET_KEY as EnvConfig["AWS_SECRET_KEY"]),
    AWS_REGION: (process.env.AWS_REGION as EnvConfig["AWS_REGION"]),
    AWS_BUCKET_NAME: (process.env.AWS_BUCKET_NAME as EnvConfig["AWS_BUCKET_NAME"]),

    EMAIL_DOMAIN: (process.env.EMAIL_DOMAIN as EnvConfig["EMAIL_DOMAIN"]),
    SES_FROM_EMAIL: (process.env.SES_FROM_EMAIL as EnvConfig["SES_FROM_EMAIL"]),

    SUPABASE_DEVELOPMENT_DATABASE_URL: (process.env.SUPABASE_DEVELOPMENT_DATABASE_URL as EnvConfig["SUPABASE_DEVELOPMENT_DATABASE_URL"]),
    SUPABASE_PRODUCTION_DATABASE_URL: (process.env.SUPABASE_PRODUCTION_DATABASE_URL as EnvConfig["SUPABASE_PRODUCTION_DATABASE_URL"]),

};