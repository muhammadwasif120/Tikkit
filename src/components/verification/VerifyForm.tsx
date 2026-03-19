'use client'

import { useState } from 'react'
import { initiateVerification } from '@/app/actions/verificationActions'
import { ShieldCheck, CreditCard, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react'
import type { VerifiedProfile } from '@/types/verification'

const CSS = `
  .vf-wrap { max-width:520px; margin:0 auto; }
  .vf-steps { display:flex; gap:0; margin-bottom:32px; position:relative; }
  .vf-steps::before {
    content:''; position:absolute; top:20px; left:10%; right:10%; height:2px;
    background:rgba(255,255,255,0.06);
  }
  .vf-step { flex:1; display:flex; flex-direction:column; align-items:center; gap:8px; position:relative; }
  .vf-step-dot {
    width:40px; height:40px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:14px; font-weight:800; border:2px solid; z-index:1; transition:all 0.3s;
  }
  .vf-step-dot.active { background:#1E5EFF; border-color:#1E5EFF; color:white; }
  .vf-step-dot.done   { background:rgba(34,197,94,0.15); border-color:#22C55E; color:#22C55E; }
  .vf-step-dot.idle   { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.1); color:#4B5563; }
  .vf-step-label { font-size:11px; font-weight:600; color:#6B7280; text-align:center; }
  .vf-step-label.active { color:#F0F2FF; }
  .vf-step-label.done   { color:#22C55E; }

  .vf-card {
    background:#0C0E16; border:1px solid rgba(255,255,255,0.07);
    border-radius:20px; padding:28px; margin-bottom:16px;
  }
  .vf-card-title { color:white; font-size:17px; font-weight:800; margin:0 0 4px; font-family:var(--font-display); }
  .vf-card-sub   { color:#6B7280; font-size:13px; margin:0 0 20px; line-height:1.6; }

  .vf-btn {
    width:100%; padding:14px; border-radius:12px; font-size:15px; font-weight:700;
    cursor:pointer; border:none; display:flex; align-items:center; justify-content:center; gap:8px;
    transition:opacity 0.2s, transform 0.2s; text-decoration:none;
  }
  .vf-btn:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
  .vf-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .vf-btn-primary { background:#1E5EFF; color:white; }
  .vf-btn-purple  { background:linear-gradient(135deg,#7C3AED,#A855F7); color:white; }
  .vf-btn-success { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.3) !important; color:#22C55E; }

  .vf-note { font-size:11px; color:#4B5563; text-align:center; margin-top:14px; line-height:1.7; }

  .vf-methods { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
  .vf-method-pill {
    display:inline-flex; align-items:center; gap:5px;
    padding:5px 12px; border-radius:100px; font-size:11px; font-weight:700;
    border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04);
    color:#9CA3AF;
  }

  .vf-amount {
    display:inline-flex; align-items:baseline; gap:4px; margin-bottom:20px;
  }
  .vf-amount-n  { color:white; font-size:28px; font-weight:900; font-family:var(--font-display); }
  .vf-amount-cu { color:#6B7280; font-size:13px; font-weight:600; }
  .vf-amount-label { color:#4B5563; font-size:12px; margin-left:6px; }
`

export default function VerifyForm({ profile }: { profile: VerifiedProfile }) {
  const [loading, setLoading] = useState(false)
  const [diditUrl, setDiditUrl] = useState<string | null>(null)
  const [payproUrl, setPayproUrl] = useState<string | null>(null)
  const [idDone, setIdDone] = useState(profile.is_id_verified)
  const [paymentDone, setPaymentDone] = useState(profile.is_payment_verified)
  const [initiated, setInitiated] = useState(false)

  const step = idDone && paymentDone ? 3 : idDone ? 2 : 1

  const handleInitiate = async () => {
    setLoading(true)
    const result = await initiateVerification()
    setLoading(false)

    if (result.error) {
      alert(result.error)
      return
    }
    setInitiated(true)
    if (result.diditSessionUrl) setDiditUrl(result.diditSessionUrl)
    if (result.payproPaymentUrl) setPayproUrl(result.payproPaymentUrl)
  }

  const stepState = (n: number) => step > n ? 'done' : step === n ? 'active' : 'idle'

  if (step === 3) {
    return (
      <>
        <style>{CSS}</style>
        <div className="vf-wrap">
          <div className="vf-card" style={{ textAlign: 'center', padding: '40px 28px' }}>
            <CheckCircle2 size={52} color="#22C55E" style={{ margin: '0 auto 16px' }} />
            <h2 className="vf-card-title" style={{ textAlign: 'center', fontSize: 20 }}>
              Triple Verified ✓
            </h2>
            <p className="vf-card-sub" style={{ textAlign: 'center', marginBottom: 0 }}>
              Your identity and payment have been verified.<br />
              You&apos;ve earned <strong style={{ color: '#FACC15' }}>+150 Social Score points</strong>.
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="vf-wrap">

        {/* Step indicator */}
        <div className="vf-steps">
          {[{ label: 'ID Verify', n: 1 }, { label: 'Payment', n: 2 }, { label: 'Verified', n: 3 }].map(({ label, n }) => (
            <div key={n} className="vf-step">
              <div className={`vf-step-dot ${stepState(n)}`}>
                {stepState(n) === 'done' ? <CheckCircle2 size={18} /> : n}
              </div>
              <span className={`vf-step-label ${stepState(n)}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Step 1: Didit ID Verification ── */}
        <div className="vf-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: idDone ? 'rgba(34,197,94,0.12)' : 'rgba(30,94,255,0.12)', border: `1px solid ${idDone ? 'rgba(34,197,94,0.25)' : 'rgba(30,94,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={18} color={idDone ? '#22C55E' : '#1E5EFF'} />
            </div>
            <div>
              <h3 className="vf-card-title">Identity Verification</h3>
              <p className="vf-card-sub" style={{ marginBottom: 0 }}>CNIC scan + passive liveness check via Didit</p>
            </div>
          </div>

          {idDone ? (
            <button className="vf-btn vf-btn-success" disabled>
              <CheckCircle2 size={16} /> ID Verified
            </button>
          ) : !initiated ? (
            <button className="vf-btn vf-btn-primary" onClick={handleInitiate} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {loading ? 'Setting up...' : 'Start ID Verification'}
            </button>
          ) : diditUrl ? (
            <a href={diditUrl} target="_blank" rel="noopener noreferrer" className="vf-btn vf-btn-primary">
              <ExternalLink size={16} /> Open ID Verification
            </a>
          ) : (
            <button className="vf-btn vf-btn-primary" disabled>
              <Loader2 size={16} className="animate-spin" /> Loading…
            </button>
          )}
          <p className="vf-note">
            Your CNIC information is processed by Didit and never stored on Tikkit servers.
          </p>
        </div>

        {/* ── Step 2: PayPro Payment ── */}
        <div className="vf-card" style={{ opacity: initiated || idDone ? 1 : 0.45 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: paymentDone ? 'rgba(34,197,94,0.12)' : 'rgba(124,58,237,0.12)', border: `1px solid ${paymentDone ? 'rgba(34,197,94,0.25)' : 'rgba(124,58,237,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCard size={18} color={paymentDone ? '#22C55E' : '#A855F7'} />
            </div>
            <div>
              <h3 className="vf-card-title">Signup Fee</h3>
              <p className="vf-card-sub" style={{ marginBottom: 0 }}>One-time verification fee — paid via PayPro</p>
            </div>
          </div>

          {/* Amount */}
          <div className="vf-amount">
            <span className="vf-amount-n">500</span>
            <span className="vf-amount-cu">PKR</span>
            <span className="vf-amount-label">· one-time · non-refundable</span>
          </div>

          {/* Accepted methods */}
          <div className="vf-methods">
            {['JazzCash', 'EasyPaisa', 'Debit Card', 'Bank Transfer'].map(m => (
              <span key={m} className="vf-method-pill">{m}</span>
            ))}
          </div>

          {paymentDone ? (
            <button className="vf-btn vf-btn-success" disabled>
              <CheckCircle2 size={16} /> Payment Verified
            </button>
          ) : payproUrl ? (
            <a
              href={payproUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vf-btn vf-btn-purple"
            >
              <ExternalLink size={16} /> Pay PKR 500 via PayPro
            </a>
          ) : (
            <button
              className="vf-btn vf-btn-purple"
              onClick={handleInitiate}
              disabled={loading || !initiated}
              style={{ opacity: initiated ? 0.5 : 0.35 }}
            >
              {initiated ? 'Generating payment link…' : 'Start ID verification first'}
            </button>
          )}

          <p className="vf-note">
            You will be redirected to PayPro&apos;s secure payment page. Return here once payment is complete.
            Verification is confirmed automatically within a few minutes.
          </p>
        </div>
      </div>
    </>
  )
}
