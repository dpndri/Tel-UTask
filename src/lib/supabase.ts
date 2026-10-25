import { createClient } from "@supabase/supabase-js";

// Fallback kredensial publishable Supabase agar tidak hilang saat dideploy ke Vercel
const DEFAULT_SUPABASE_URL = "https://tzlilstephapmaculinz.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_OZIwW4JuSpXys2hK5L4aNg_j95_R0yU";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes("your-project-ref")
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
