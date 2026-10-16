import PaymentAccounts from '@/components/settings/PaymentAccounts'
import { requireOwner } from '@/lib/data/viewer'

export const metadata = { title: 'Payment accounts' }

export default async function PaymentsSettings() {
  const { supabase, profile } = await requireOwner()
  const { data } = await supabase.from('payment_accounts').select('*').eq('organizer_id', profile.id).order('created_at')
  return <PaymentAccounts accounts={(data ?? []).map(a => ({ id: a.id, method: a.method, title: a.account_title, number: a.account_number, bank: a.bank_name, iban: a.iban, instructions: a.instructions, active: a.is_active, label: a.label }))} />
}
