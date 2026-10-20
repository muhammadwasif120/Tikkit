import Link from 'next/link'
import { CalendarClock, Layers, Trophy, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/kit'
import AttendeeProfile from '@/components/attendee/AttendeeProfile'
import EmailPrefs from '@/components/attendee/EmailPrefs'
import VerificationForm from '@/components/settings/VerificationForm'
import { requireAttendee } from '@/lib/data/viewer'

export const metadata = { title: 'Profile' }

const LINKS = [
  { href: '/guest/wallet', label: 'Wallet', note: 'Passes and payments', icon: Wallet },
  { href: '/guest/schedule', label: 'Schedule', note: 'Add to your calendar', icon: CalendarClock },
  { href: '/guest/score', label: 'Score', note: 'Your tier and streak', icon: Trophy },
  { href: '/guest/tickets', label: 'Collection', note: 'Nights you attended', icon: Layers },
] as const

export default async function ProfilePage() {
  const { supabase, profile, user } = await requireAttendee()
  const { data: priv } = await supabase.from('profile_private').select('phone, gender, date_of_birth, id_status, id_reject_reason, notification_prefs').eq('id', profile.id).maybeSingle()
  const emailUpdates = (priv?.notification_prefs as { email_updates?: boolean } | null)?.email_updates !== false
  return (
    <div className="k-fade-up space-y-6">
      <PageHeader title="Profile" description="Your details, verification and preferences." />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LINKS.map(l => (
          <li key={l.href}><Link href={l.href} className="flex h-full flex-col rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line transition-colors hover:bg-raised"><l.icon className="h-5 w-5 text-accent" aria-hidden /><span className="mt-3 text-sm font-semibold text-fg">{l.label}</span><span className="text-xs text-muted">{l.note}</span></Link></li>
        ))}
      </ul>
      <AttendeeProfile avatarUrl={profile.avatar_url} initial={{ name: profile.full_name ?? '', city: profile.city ?? '', phone: priv?.phone ?? '', gender: priv?.gender ?? '', dob: priv?.date_of_birth ?? '', email: user.email ?? '' }} />
      <EmailPrefs initial={emailUpdates} />
      <section id="verify" className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-fg">Verify your ID</h2>
        <VerificationForm audience="attendee" status={priv?.id_status ?? 'none'} reason={priv?.id_reject_reason ?? null} optionalNote="Optional. It earns you a verified check and unlocks verified-only events." />
      </section>
    </div>
  )
}
