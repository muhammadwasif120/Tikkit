import { redirect } from 'next/navigation'
import { getVerificationStatus } from '@/app/actions/verificationActions'
import VerifyForm from '@/components/verification/VerifyForm'
import VerificationBadges from '@/components/verification/VerificationBadges'
import { ShieldCheck, Lock, Star, Info } from 'lucide-react'

const WHY_CARDS = [
  {
    icon: Star,
    color: '#FACC15',
    title: 'Priority placement',
    text: 'Verified organizers appear higher in search and get a gold badge on their public profile.',
  },
  {
    icon: Lock,
    color: '#A855F7',
    title: 'Your data is safe',
    text: 'CNIC data is processed by Didit. Payment info is held by PayPro. Nothing is stored on Tikkit servers.',
  },
  {
    icon: Info,
    color: '#1E5EFF',
    title: 'One-time only',
    text: 'Verification is completed once. Your Social Score builds permanently from events and activity.',
  },
]

export default async function VerifyPage() {
  const profile = await getVerificationStatus()
  if (!profile) redirect('/auth/login')

  const fullyVerified = profile.is_id_verified && profile.is_payment_verified

  return (
    <div style={{ padding: '28px 24px', maxWidth: 660 }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: fullyVerified
            ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))'
            : 'linear-gradient(135deg, rgba(30,94,255,0.2), rgba(168,85,247,0.12))',
          border: `1px solid ${fullyVerified ? 'rgba(34,197,94,0.3)' : 'rgba(30,94,255,0.25)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: fullyVerified
            ? '0 8px 24px rgba(34,197,94,0.15)'
            : '0 8px 24px rgba(30,94,255,0.15)',
        }}>
          <ShieldCheck size={22} color={fullyVerified ? '#22C55E' : '#1E5EFF'} />
        </div>
        <div>
          <h1 style={{
            color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 4px',
            fontFamily: 'var(--font-display)', letterSpacing: '-0.4px',
          }}>
            Triple Verification
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {fullyVerified
              ? 'Your account is fully verified — all features unlocked.'
              : 'Verify your identity and payment to unlock full platform access'}
          </p>
        </div>
      </div>

      {/* ── Status card ─────────────────────────────────────── */}
      <div style={{
        background: '#0C0E16', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 18, padding: '20px 22px', marginBottom: 28,
      }}>
        <p style={{
          color: '#4B5563', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 14px',
        }}>
          Current Status
        </p>
        <VerificationBadges
          isIdVerified={profile.is_id_verified}
          isPaymentVerified={profile.is_payment_verified}
          socialScore={profile.social_score}
          size="md"
        />
        {fullyVerified && (
          <div style={{
            marginTop: 16, padding: '12px 16px',
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} />
            <p style={{ color: '#22C55E', fontSize: 13, fontWeight: 600, margin: 0 }}>
              Fully verified — <span style={{ color: '#FACC15' }}>+150 Social Score</span> awarded
            </p>
          </div>
        )}
      </div>

      {/* ── Verification form ─────────────────────────────── */}
      {!fullyVerified && <VerifyForm profile={profile} />}

      {/* ── Why cards ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 32 }}>
        {WHY_CARDS.map(({ icon: Icon, color, title, text }) => (
          <div key={title} style={{
            background: '#0C0E16', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '18px 18px',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, marginBottom: 12,
              background: `${color}15`, border: `1px solid ${color}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={16} color={color} />
            </div>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>
              {title}
            </p>
            <p style={{ color: '#6B7280', fontSize: 12, margin: 0, lineHeight: 1.65 }}>
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
