import VerificationForm from '@/components/settings/VerificationForm'
import { requireOrganizer } from '@/lib/data/viewer'

export const metadata = { title: 'Verification' }

export default async function VerificationSettings() {
  const { supabase, profile } = await requireOrganizer()
  const { data } = await supabase.from('profile_private').select('id_status, id_reject_reason').eq('id', profile.id).maybeSingle()
  return <VerificationForm status={data?.id_status ?? 'none'} reason={data?.id_reject_reason ?? null} />
}
