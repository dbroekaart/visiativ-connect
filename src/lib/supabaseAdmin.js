import { createClient } from '@supabase/supabase-js'

// Admin client uses the service role key — bypasses RLS and can delete auth users.
// Only used in the admin reset flow. Never expose this client to regular users.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null
