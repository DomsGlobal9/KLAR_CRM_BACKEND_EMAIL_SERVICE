import dotenv from "dotenv";

dotenv.config();

type EnvConfig = {
    PORT: number;
    NODE_ENV: "development" | "production" | "test";

    CORS_ORIGIN: string[];
    CORS_METHODS: string[];
    CORS_ALLOWED_HEADERS: string[];
    CORS_CREDENTIALS: boolean;
    CORS_MAX_AGE: number;

    AWS_ACCESS_KEY: string;
    AWS_SECRET_KEY: string;
    AWS_REGION: string;
    AWS_BUCKET_NAME: string;

    EMAIL_DOMAIN: string;
    SES_FROM_EMAIL: string;

    SUPABASE_DEVELOPMENT_DATABASE_URL: string;
    SUPABASE_PRODUCTION_DATABASE_URL: string;

    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD?: string;
    REDIS_DB: number;
};

const requiredEnv = (key: string, value?: string): string => {
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
};

const parseArray = (value?: string): string[] => {
    if (!value) return [];
    return value.split(',').map(item => item.trim());
};

const parseBoolean = (value?: string): boolean => {
    return value?.toLowerCase() === 'true';
};

const parseNumber = (value?: string, defaultValue?: number): number => {
    if (!value) return defaultValue || 0;
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue || 0 : parsed;
};

export const envConfig: EnvConfig = {
    PORT: parseNumber(process.env.PORT, 5012),
    NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]),

    CORS_ORIGIN: parseArray(process.env.CORS_ORIGIN),
    CORS_METHODS: parseArray(process.env.CORS_METHODS),
    CORS_ALLOWED_HEADERS: parseArray(process.env.CORS_ALLOWED_HEADERS),
    CORS_CREDENTIALS: parseBoolean(process.env.CORS_CREDENTIALS),
    CORS_MAX_AGE: parseNumber(process.env.CORS_MAX_AGE, 86400),

    AWS_ACCESS_KEY: requiredEnv("AWS_ACCESS_KEY", process.env.AWS_ACCESS_KEY),
    AWS_SECRET_KEY: requiredEnv("AWS_SECRET_KEY", process.env.AWS_SECRET_KEY),
    AWS_REGION: requiredEnv("AWS_REGION", process.env.AWS_REGION),
    AWS_BUCKET_NAME: requiredEnv("AWS_BUCKET_NAME", process.env.AWS_BUCKET_NAME),

    EMAIL_DOMAIN: requiredEnv("EMAIL_DOMAIN", process.env.EMAIL_DOMAIN),
    SES_FROM_EMAIL: requiredEnv("SES_FROM_EMAIL", process.env.SES_FROM_EMAIL),

    SUPABASE_DEVELOPMENT_DATABASE_URL: requiredEnv("SUPABASE_DEVELOPMENT_DATABASE_URL", process.env.SUPABASE_DEVELOPMENT_DATABASE_URL),
    SUPABASE_PRODUCTION_DATABASE_URL: requiredEnv("SUPABASE_PRODUCTION_DATABASE_URL", process.env.SUPABASE_PRODUCTION_DATABASE_URL),

    REDIS_HOST: process.env.REDIS_HOST || "localhost",
    REDIS_PORT: parseNumber(process.env.REDIS_PORT, 6379),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
    REDIS_DB: parseNumber(process.env.REDIS_DB, 0),
};