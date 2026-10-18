'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encrypt'

/** Reveals one ID number to an admin. Checked against profiles.role and written to the audit log. */
export async function revealIdNumber(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (me?.role !== 'admin') return { error: 'Forbidden' }
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: 'Not found' }
  const { data } = await supabase.from('profile_private').select('id_number_enc, id_type').eq('id', userId).maybeSingle()
  if (!data?.id_number_enc) return { error: 'No number on file' }
  // Every reveal is logged before the number is returned. If the log cannot be written, nothing is revealed.
  const { error: logErr } = await createAdminClient().from('admin_audit_log').insert({ actor_id: user.id, action: 'reveal_id_number', entity: 'profile', entity_id: userId, details: {} })
  if (logErr) return { error: 'Could not record this access, so it was not allowed.' }
  try { return { number: decrypt(data.id_number_enc), type: data.id_type } } catch { return { error: 'Could not decrypt' } }
}
