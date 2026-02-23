'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTeamInvite(
  label: string,
  role: 'staff' | 'organizer',
  expiresIn: string | null // '24h', '7d', '30d', or null for never
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let expires_at: string | null = null
  if (expiresIn) {
    const ms: Record<string, number> = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 }
    expires_at = new Date(Date.now() + ms[expiresIn]).toISOString()
  }

  const { data, error } = await supabase
    .from('team_invites')
    .insert({ organizer_id: user.id, label, role, expires_at })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/settings')
  return data
}

export async function revokeTeamInvite(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('team_invites')
    .update({ revoked: true })
    .eq('id', id)
    .eq('organizer_id', user.id)

  revalidatePath('/dashboard/settings')
}

export async function deleteTeamInvite(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('team_invites')
    .delete()
    .eq('id', id)
    .eq('organizer_id', user.id)

  revalidatePath('/dashboard/settings')
}

export async function reactivateTeamInvite(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('team_invites')
    .update({ revoked: false })
    .eq('id', id)
    .eq('organizer_id', user.id)

  revalidatePath('/dashboard/settings')
}