import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database/schema';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL environment variable is not set');
if (!supabaseAnonKey) throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not set');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);