import postgres from 'postgres';
import * as schema from './schemas';
import { envConfig } from '../config/env.config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DATABASE_URL } from '../config/supabase.config';



if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in environment variables');
}

const client = postgres(DATABASE_URL, { prepare: false });
export const db = drizzle(client, { schema });