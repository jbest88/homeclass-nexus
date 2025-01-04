import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aipntindhsqqkwflqfrz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpcG50aW5kaHNxcWt3ZmxxZnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMDA4NzYsImV4cCI6MjA1MTU3Njg3Nn0.itELFm0ICjAceQzdM7n4XoAohOCwS2PLYJYOoRIvJts';

if (!supabaseUrl) throw new Error('Missing SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);