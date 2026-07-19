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
    DEFAULT_FROM_EMAIL: string;
    DEFAULT_FROM_NAME: string;
    DEFAULT_REPLY_TO: string;

    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_SECURE: boolean;
    SMTP_USER: string;
    SMTP_PASS: string;

    IMAP_HOST: string;
    IMAP_PORT: number;
    IMAP_SECURE: boolean;
    IMAP_USER: string;
    IMAP_PASS: string;

    SUPABASE_PRODUCTION_URL: string;
    SUPABASE_PRODUCTION_ANON_KEY: string;
    SUPABASE_PRODUCTION_SERVICE_ROLE: string;
    SUPABASE_PRODUCTION_DATABASE_URL: string;

    SUPABASE_DEVELOPMENT_URL: string;
    SUPABASE_DEVELOPMENT_ANON_KEY: string;
    SUPABASE_DEVELOPMENT_SERVICE_ROLE: string;
    SUPABASE_DEVELOPMENT_DATABASE_URL: string;

    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE: string;
    SUPABASE_DATABASE_URL: string;

    OTP: {
        LENGTH: number;
        EXPIRY_MINUTES: number;
        BYPASS_IN_DEV: boolean;
        USE_NUMERIC_ONLY: boolean;
        MAX_RESEND_ATTEMPTS: number;
        DEV_STATIC_CODE: string;
        RESEND_WINDOW_MINUTES: number;
        RESEND_COOLDOWN_SECONDS: number;
        MAX_VERIFICATION_ATTEMPTS: number;
    };

    WHATSAPP_NUMBER: string;
    ITIENARY_STAGE: string;
    QUOTE_STAGE: string;
    S3_SERVER_URL: string;
};

const requiredEnv = (key: string, value?: string): string => {
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
};

const parseArray = (value?: string, defaultValue: string[] = []): string[] => {
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim());
};

const parseBoolean = (value?: string, defaultValue: boolean = false): boolean => {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
};

const parseNumber = (value?: string, defaultValue: number = 0): number => {
    if (!value) return defaultValue;
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

const getEnv = (key: string, fallback?: string): string => {
    return process.env[key] || fallback || '';
};

const nodeEnv = (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) || "development";

export const envConfig: EnvConfig = {
    PORT: parseNumber(process.env.PORT, 5012),
    NODE_ENV: nodeEnv,

    CORS_ORIGIN: parseArray(process.env.CORS_ORIGIN, ['http://localhost:3000']),
    CORS_METHODS: parseArray(process.env.CORS_METHODS, ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
    CORS_ALLOWED_HEADERS: parseArray(process.env.CORS_ALLOWED_HEADERS, ['Content-Type', 'Authorization']),
    CORS_CREDENTIALS: parseBoolean(process.env.CORS_CREDENTIALS, true),
    CORS_MAX_AGE: parseNumber(process.env.CORS_MAX_AGE, 86400),

    AWS_ACCESS_KEY: requiredEnv("AWS_ACCESS_KEY", process.env.AWS_ACCESS_KEY),
    AWS_SECRET_KEY: requiredEnv("AWS_SECRET_KEY", process.env.AWS_SECRET_KEY),
    AWS_REGION: requiredEnv("AWS_REGION", process.env.AWS_REGION),
    AWS_BUCKET_NAME: requiredEnv("AWS_BUCKET_NAME", process.env.AWS_BUCKET_NAME),

    EMAIL_DOMAIN: getEnv("EMAIL_DOMAIN", "villy.in"),
    SES_FROM_EMAIL: requiredEnv("SES_FROM_EMAIL", process.env.SES_FROM_EMAIL),
    DEFAULT_FROM_EMAIL: getEnv("DEFAULT_FROM_EMAIL", process.env.SES_FROM_EMAIL || "noreply@example.com"),
    DEFAULT_FROM_NAME: getEnv("DEFAULT_FROM_NAME", "Your App"),
    DEFAULT_REPLY_TO: getEnv("DEFAULT_REPLY_TO", process.env.SES_FROM_EMAIL || "noreply@example.com"),

    SMTP_HOST: requiredEnv("SMTP_HOST", process.env.SMTP_HOST),
    SMTP_PORT: parseNumber(process.env.SMTP_PORT, 587),
    SMTP_SECURE: parseBoolean(process.env.SMTP_SECURE, false),
    SMTP_USER: requiredEnv("SMTP_USER", process.env.SMTP_USER),
    SMTP_PASS: requiredEnv("SMTP_PASS", process.env.SMTP_PASS),

    IMAP_HOST: requiredEnv("IMAP_HOST", process.env.IMAP_HOST),
    IMAP_PORT: parseNumber(process.env.IMAP_PORT, 993),
    IMAP_SECURE: parseBoolean(process.env.IMAP_SECURE, true),
    IMAP_USER: requiredEnv("IMAP_USER", process.env.IMAP_USER),
    IMAP_PASS: requiredEnv("IMAP_PASS", process.env.IMAP_PASS),

    SUPABASE_PRODUCTION_URL: requiredEnv("SUPABASE_PRODUCTION_URL", process.env.SUPABASE_PRODUCTION_URL),
    SUPABASE_PRODUCTION_ANON_KEY: requiredEnv("SUPABASE_PRODUCTION_ANON_KEY", process.env.SUPABASE_PRODUCTION_ANON_KEY),
    SUPABASE_PRODUCTION_SERVICE_ROLE: requiredEnv("SUPABASE_PRODUCTION_SERVICE_ROLE", process.env.SUPABASE_PRODUCTION_SERVICE_ROLE),
    SUPABASE_PRODUCTION_DATABASE_URL: requiredEnv("SUPABASE_PRODUCTION_DATABASE_URL", process.env.SUPABASE_PRODUCTION_DATABASE_URL),

    SUPABASE_DEVELOPMENT_URL: requiredEnv("SUPABASE_DEVELOPMENT_URL", process.env.SUPABASE_DEVELOPMENT_URL),
    SUPABASE_DEVELOPMENT_ANON_KEY: requiredEnv("SUPABASE_DEVELOPMENT_ANON_KEY", process.env.SUPABASE_DEVELOPMENT_ANON_KEY),
    SUPABASE_DEVELOPMENT_SERVICE_ROLE: requiredEnv("SUPABASE_DEVELOPMENT_SERVICE_ROLE", process.env.SUPABASE_DEVELOPMENT_SERVICE_ROLE),
    SUPABASE_DEVELOPMENT_DATABASE_URL: requiredEnv("SUPABASE_DEVELOPMENT_DATABASE_URL", process.env.SUPABASE_DEVELOPMENT_DATABASE_URL),

    SUPABASE_URL: nodeEnv === 'production' 
        ? requiredEnv("SUPABASE_PRODUCTION_URL", process.env.SUPABASE_PRODUCTION_URL)
        : requiredEnv("SUPABASE_DEVELOPMENT_URL", process.env.SUPABASE_DEVELOPMENT_URL),
    
    SUPABASE_ANON_KEY: nodeEnv === 'production'
        ? requiredEnv("SUPABASE_PRODUCTION_ANON_KEY", process.env.SUPABASE_PRODUCTION_ANON_KEY)
        : requiredEnv("SUPABASE_DEVELOPMENT_ANON_KEY", process.env.SUPABASE_DEVELOPMENT_ANON_KEY),
    
    SUPABASE_SERVICE_ROLE: nodeEnv === 'production'
        ? requiredEnv("SUPABASE_PRODUCTION_SERVICE_ROLE", process.env.SUPABASE_PRODUCTION_SERVICE_ROLE)
        : requiredEnv("SUPABASE_DEVELOPMENT_SERVICE_ROLE", process.env.SUPABASE_DEVELOPMENT_SERVICE_ROLE),
    
    SUPABASE_DATABASE_URL: nodeEnv === 'production'
        ? requiredEnv("SUPABASE_PRODUCTION_DATABASE_URL", process.env.SUPABASE_PRODUCTION_DATABASE_URL)
        : requiredEnv("SUPABASE_DEVELOPMENT_DATABASE_URL", process.env.SUPABASE_DEVELOPMENT_DATABASE_URL),

    OTP: {
        LENGTH: parseNumber(process.env.OTP_LENGTH, 6),
        EXPIRY_MINUTES: parseNumber(process.env.OTP_EXPIRY_MINUTES, 10),
        BYPASS_IN_DEV: parseBoolean(process.env.OTP_BYPASS_IN_DEV, true),
        USE_NUMERIC_ONLY: parseBoolean(process.env.OTP_USE_NUMERIC_ONLY, true),
        MAX_RESEND_ATTEMPTS: parseNumber(process.env.OTP_MAX_RESEND_ATTEMPTS, 3),
        DEV_STATIC_CODE: getEnv("OTP_DEV_STATIC_CODE", "123456"),
        RESEND_WINDOW_MINUTES: parseNumber(process.env.OTP_RESEND_WINDOW_MINUTES, 30),
        RESEND_COOLDOWN_SECONDS: parseNumber(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
        MAX_VERIFICATION_ATTEMPTS: parseNumber(process.env.OTP_MAX_VERIFICATION_ATTEMPTS, 5),
    },

    WHATSAPP_NUMBER: getEnv("WHATSAPP_NUMBER", ""),
    ITIENARY_STAGE: getEnv("ITINERARY_STAGE_ID", ""),
    QUOTE_STAGE: getEnv("QUOTE_STAGE_ID", ""),
    S3_SERVER_URL: getEnv("S3_SERVER", ""),
};