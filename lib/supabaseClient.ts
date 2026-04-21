import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize the anonymous client for frontend usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Real-time channels can be accessed via `supabase.channel(...)`
