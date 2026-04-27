import { createClient } from '@supabase/supabase-js';

// Fallback dummies prevent "supabaseUrl is required" crash during SSG build phase.
// At runtime on Vercel, the real NEXT_PUBLIC_* values will be used.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://build-bypass.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-bypass-key';

// Initialize the anonymous client for frontend usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Real-time channels can be accessed via `supabase.channel(...)`
