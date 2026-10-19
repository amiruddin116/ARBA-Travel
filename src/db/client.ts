// Supabase clients for the ARBA Context OS.
//
// Two clients, two very different trust levels:
//   createUserClient  — carries the signed-in user's JWT; RLS IS enforced.
//                        Use for ALL end-user reads and writes, incl. AI search.
//   createServiceClient — service-role key; RLS IS BYPASSED. Use ONLY for
//                        trusted server-side jobs (ingestion, migrations).
//                        Never send the service key to the browser.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
  );
}

/** Request-scoped client bound to a user's access token. RLS enforced. */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(url as string, anonKey as string, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Trusted server-only client. BYPASSES RLS — never expose to the browser. */
export function createServiceClient(): SupabaseClient {
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url as string, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
