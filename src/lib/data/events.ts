import 'server-only'
import type { requireOrganizer } from './viewer'
import { planLabel } from './viewer'

type Org = Awaited<ReturnType<typeof requireOrganizer>>

/** Everything the event form needs that is not the event itself. */
export async function eventFormContext({ supabase, profile, entitlements }: Org) {
  const [{ data: cats }, { data: accts }, { data: priv }] = await Promise.all([
    supabase.from('event_categories').select('id, name').order('sort'),
    supabase.from('payment_accounts').select('id, method, account_title, account_number, bank_name').eq('organizer_id', profile.id),
    supabase.from('profile_private').select('id_status').eq('id', profile.id).maybeSingle(),
  ])
  const lim = entitlements?.limits ?? {}
  const cap = typeof lim.registrations_per_event === 'number' ? lim.registrations_per_event : null
  const label = planLabel(entitlements)
  return {
    categories: cats ?? [],
    accounts: (accts ?? []).map(a => ({
      id: a.id,
      label: a.method === 'bank' ? (a.bank_name ?? 'Bank transfer') : a.method === 'jazzcash' ? 'JazzCash' : a.method === 'easypaisa' ? 'EasyPaisa' : (a.account_title ?? 'Account'),
      detail: a.account_number.length > 6 ? `${a.account_number.slice(0, 4)} ••• ${a.account_number.slice(-4)}` : a.account_number,
    })),
    idVerified: priv?.id_status === 'verified',
    limits: {
      registrationsPerEvent: cap !== null && cap > 0 ? cap : null,
      autoReveal: lim.auto_reveal === true,
      idRequiredEvents: lim.id_required_events === true,
      planLabel: `${label.label} plan. ${label.note}.`,
    },
  }
}
