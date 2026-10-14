'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Sign out and return to the home page. Used by the gated Vendor X shell. */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
