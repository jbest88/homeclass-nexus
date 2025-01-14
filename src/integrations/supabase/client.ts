import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aipntindhsqqkwflqfrz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpcG50aW5kaHNxcWt3ZmxxZnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDUyMzg4MDAsImV4cCI6MjAyMDgxNDgwMH0.0BoJxY0jUhHtGpFYJcHbody_kpd9sQBZQeYQpzGzBBE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});