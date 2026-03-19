import { redirect } from 'next/navigation'
import { getVerificationStatus } from '@/app/actions/verificationActions'
import VerifyForm from '@/components/verification/VerifyForm'
import VerificationBadges from '@/components/verification/VerificationBadges'
import { ShieldCheck } from 'lucide-react'

export default async function VerifyPage() {
  const profile = await getVerificationStatus()
  if (!profile) redirect('/auth/login')

  const fullyVerified = profile.is_id_verified && profile.is_payment_verified

  return (
    <div style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(30,94,255,0.12)', border: '1px solid rgba(30,94,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} color="#1E5EFF" />
          </div>
          <div>
            <h1 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)' }}>
              Triple Verification
            </h1>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
              Verify your identity and payment to unlock full platform access
            </p>
          </div>
        </div>

        {/* Current status badges */}
        <div style={{ marginTop: 16, padding: '16px 20px', background: '#0C0E16', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: '#4B5563', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Current Status
          </p>
          <VerificationBadges
            isIdVerified={profile.is_id_verified}
            isPaymentVerified={profile.is_payment_verified}
            socialScore={profile.social_score}
            size="md"
          />
          {fullyVerified && (
            <p style={{ color: '#22C55E', fontSize: 12, fontWeight: 600, margin: '12px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} /> You are fully verified — +150 Social Score awarded
            </p>
          )}
        </div>
      </div>

      {/* Verification form */}
      {!fullyVerified && <VerifyForm profile={profile} />}

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 32 }}>
        {[
          { title: 'Why verify?', text: 'Verified organizers get priority placement, higher guest trust, and access to premium features.' },
          { title: 'Your data', text: 'CNIC data is processed by Didit and never stored on Tikkit servers. Payment info is held by Stripe.' },
          { title: 'One-time only', text: 'Verification is done once. Your Social Score builds permanently from events and activity.' },
        ].map(({ title, text }) => (
          <div key={title} style={{ background: '#0C0E16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px' }}>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>{title}</p>
            <p style={{ color: '#6B7280', fontSize: 12, margin: 0, lineHeight: 1.6 }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
