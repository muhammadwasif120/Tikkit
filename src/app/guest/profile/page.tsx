import { PageHeader } from '@/components/kit'
import AttendeeProfile from '@/components/attendee/AttendeeProfile'
import VerificationForm from '@/components/settings/VerificationForm'
import { requireAttendee } from '@/lib/data/viewer'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const { supabase, profile, user } = await requireAttendee()
  const { data: priv } = await supabase.from('profile_private').select('phone, gender, date_of_birth, id_status, id_reject_reason').eq('id', profile.id).maybeSingle()
  return (
    <div className="k-fade-up space-y-6">
      <PageHeader title="Profile" description="Your details, verification and appearance." />
      <AttendeeProfile initial={{ name: profile.full_name ?? '', city: profile.city ?? '', phone: priv?.phone ?? '', gender: priv?.gender ?? '', dob: priv?.date_of_birth ?? '', email: user.email ?? '' }} />
      <section id="verify" className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-fg">Verify your ID</h2>
        <VerificationForm status={priv?.id_status ?? 'none'} reason={priv?.id_reject_reason ?? null} optionalNote="Optional. It earns you a verified check and unlocks verified-only events." />
      </section>
    </div>
  )
}
