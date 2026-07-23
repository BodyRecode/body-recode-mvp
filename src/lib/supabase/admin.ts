import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. It carries no user session (stateless), so we
 * memoize a single instance across requests instead of re-parsing config and
 * constructing a new client on every call/page render. Safe because we only
 * ever issue queries with it — never sign in / mutate auth state.
 */
let cached: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (cached) return cached
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  return cached
}
