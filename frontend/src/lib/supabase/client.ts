import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bbxcimubvmarachjvnwo.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_kFeMK-49o6KV_fP1hVSy1w_EFUqNIxz';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
