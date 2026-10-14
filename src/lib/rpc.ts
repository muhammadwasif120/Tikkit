import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Calls a database function that is not in the generated types yet (the modules migration).
 * Remove this helper and call supabase.rpc directly after regenerating database.types.ts.
 */
export function rpcLoose(supabase: SupabaseClient<never>, name: string, args?: Record<string, unknown>) {
  return (supabase as unknown as SupabaseClient).rpc(name, args ?? {})
}

/** Reads a table that is not in the generated types yet. Same removal note as rpcLoose. */
export function fromLoose(supabase: SupabaseClient<never>, table: string) {
  return (supabase as unknown as SupabaseClient).from(table)
}
