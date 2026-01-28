import { createClient } from '@supabase/supabase-js'

import { ENV } from '@/lib/env'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

