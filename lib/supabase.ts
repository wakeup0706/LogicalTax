import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase Environment Variables. Please check .env.local");
    // We don't throw here to avoid crashing the build time if envs aren't present yet, 
    // but the client will be unusable.
}

// Client for public usage (client-side)
// Use a fallback or avoid calling createClient if URL is bad to prevent crash
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {} as any; // Fallback to prevent immediate crash, will fail on usage

// Client for server-side admin usage (bypass RLS)
export const supabaseAdmin = supabaseServiceKey && supabaseUrl
    ? createClient(supabaseUrl, supabaseServiceKey)
    : (null as any);
