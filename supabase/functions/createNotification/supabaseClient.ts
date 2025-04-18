import { createClient } from '@supabase/supabase-js'

export function createClientInstance(supabaseUrl: string, supabaseKey: string) {
  return createClient(supabaseUrl, supabaseKey)
}
