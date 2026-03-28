import { redirect } from 'next/navigation'
import { getCnicStatus } from '@/app/actions/cnicActions'
import VerifyForm from '@/components/verification/VerifyForm'
import { ShieldCheck, Star, Lock, Clock } from 'lucide-react'

const WHY_CARDS = [
  {
    icon: Star,
    color: '#FACC15',
    title: 'Priority placement',
    text: 'Verified organizers get a gold badge on their profile and higher visibility in search.',
  },
  {
    icon: Lock,
    color: '#A855F7',
    title: 'Secure & private',
    text: 'Your CNIC is stored with a Tikkit X watermark and only accessible to our verification team.',
  },
  {
    icon: Clock,
    color: '#1E5EFF',
    title: 'Quick review',
    text: 'Our team reviews submitted CNICs within 1–2 business days.',
  },
]

export default async function VerifyPage() {
  const profile = await getCnicStatus()
  if (!profile) redirect('/auth/login')

  const isVerified = profile.cnic_status === 'verified'
  const isPending  = profile.cnic_status === 'pending'

  return (
    <div style={{ padding: '28px 24px', maxWidth: 660 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: isVerified
            ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))'
            : isPending
              ? 'linear-gradient(135deg, rgba(255,199,69,0.15), rgba(255,199,69,0.08))'
              : 'linear-gradient(135deg, rgba(30,94,255,0.2), rgba(30,94,255,0.1))',
          border: `1px solid ${isVerified ? 'rgba(34,197,94,0.3)' : isPending ? 'rgba(255,199,69,0.3)' : 'rgba(30,94,255,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isVerified ? '0 8px 24px rgba(34,197,94,0.15)' : '0 8px 24px rgba(30,94,255,0.15)',
        }}>
          <ShieldCheck size={22} color={isVerified ? '#22C55E' : isPending ? '#FFC745' : '#1E5EFF'} />
        </div>
        <div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 4px', fontFamily: 'var(--font-display)', letterSpacing: '-0.4px' }}>
            Identity Verification
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {isVerified
              ? 'Your identity has been verified — all features unlocked.'
              : isPending
                ? 'Your CNIC is under review. We\'ll notify you once complete.'
                : 'Verify your identity with your CNIC to unlock full platform access.'}
          </p>
        </div>
      </div>

      {/* ── Status badge ── */}
      {(isVerified || isPending) && (
        <div style={{
          background: '#0C0E16', border: `1px solid ${isVerified ? 'rgba(34,197,94,0.15)' : 'rgba(255,199,69,0.15)'}`,
          borderRadius: 14, padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <ShieldCheck size={16} color={isVerified ? '#22C55E' : '#FFC745'} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ color: isVerified ? '#22C55E' : '#FFC745', fontSize: 13, fontWeight: 700, margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>
              {isVerified ? 'Verified' : 'Under Review'}
            </p>
            {profile.cnic_number && (
              <p style={{ color: '#4B5563', fontSize: 12, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                {profile.cnic_number}
              </p>
            )}
          </div>
          {isVerified && (
            <div style={{ marginLeft: 'auto', fontSize: 12, color: '#FACC15', fontWeight: 700 }}>+100 Social Score</div>
          )}
        </div>
      )}

      {/* ── Verification form ── */}
      <VerifyForm profile={profile} />

      {/* ── Why cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12, marginTop: 32 }}>
        {WHY_CARDS.map(({ icon: Icon, color, title, text }) => (
          <div key={title} style={{ background: '#0C0E16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, marginBottom: 12, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} color={color} />
            </div>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>{title}</p>
            <p style={{ color: '#6B7280', fontSize: 12, margin: 0, lineHeight: 1.65 }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
