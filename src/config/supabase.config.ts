import { envConfig } from './env.config';

export const supabaseConfig = {

    getDatabaseUrl: (): string => {
        if (envConfig.NODE_ENV === 'production') {
            return envConfig.SUPABASE_PRODUCTION_DATABASE_URL;
        }
        else if (envConfig.NODE_ENV === 'development') {
            return envConfig.SUPABASE_DEVELOPMENT_DATABASE_URL;
        }
        else {
            return 'Environment not found';
        }        
    },
};


export const DATABASE_URL = supabaseConfig.getDatabaseUrl();