import { createClient } from '@supabase/supabase-js'

// Solo usar en Server Actions/Route Handlers (nunca en cliente)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
