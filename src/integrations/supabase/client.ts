import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://aipntindhsqqkwflqfrz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpcG50aW5kaHNxcWt3ZmxxZnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMDA4NzYsImV4cCI6MjA1MTU3Njg3Nn0.itELFm0ICjAceQzdM7n4XoAohOCwS2PLYJYOoRIvJts";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});