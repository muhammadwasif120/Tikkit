'use client'

import React, { useState } from 'react'
import { initiateVerification } from '@/app/actions/verificationActions'
import { ShieldCheck, CreditCard, ExternalLink, Loader2, CheckCircle2, Lock } from 'lucide-react'
import type { VerifiedProfile } from '@/types/verification'

const PAYMENT_METHODS = ['JazzCash', 'EasyPaisa', 'Debit Card', 'Bank Transfer']

const CSS = `
  .vf-wrap { width:100%; }

  /* Step indicator */
  .vf-stepper { display:flex; align-items:center; margin-bottom:28px; }
  .vf-step     { display:flex; flex-direction:column; align-items:center; gap:6px; position:relative; z-index:1; }
  .vf-step-dot {
    width:38px; height:38px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:13px; font-weight:800; border:2px solid; transition:all 0.25s;
  }
  .vf-step-dot.active {
    background:#1E5EFF; border-color:#1E5EFF; color:white;
    box-shadow:0 0 16px rgba(30,94,255,0.35);
  }
  .vf-step-dot.done {
    background:rgba(34,197,94,0.15); border-color:#22C55E; color:#22C55E;
  }
  .vf-step-dot.idle {
    background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.1); color:#374151;
  }
  .vf-step-label { font-size:10px; font-weight:700; letter-spacing:0.03em; }
  .vf-step-label.active { color:#F0F2FF; }
  .vf-step-label.done   { color:#22C55E; }
  .vf-step-label.idle   { color:#374151; }

  .vf-connector { flex:1; height:2px; margin:0 6px; margin-bottom:20px; border-radius:2px; }
  .vf-connector.done   { background:rgba(34,197,94,0.4); }
  .vf-connector.active { background:linear-gradient(90deg,rgba(34,197,94,0.4),rgba(30,94,255,0.35)); }
  .vf-connector.idle   { background:rgba(255,255,255,0.06); }

  /* Cards */
  .vf-card {
    background:#0C0E16; border:1px solid rgba(255,255,255,0.08);
    border-radius:18px; padding:22px 22px 20px; margin-bottom:12px;
    transition:border-color 0.2s, opacity 0.2s;
  }
  .vf-card.locked { opacity:0.42; pointer-events:none; }
  .vf-card-head { display:flex; align-items:center; gap:13px; margin-bottom:18px; }
  .vf-card-icon {
    width:42px; height:42px; border-radius:13px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; border:1px solid;
  }
  .vf-card-title { color:white; font-size:16px; font-weight:800; margin:0 0 3px; font-family:var(--font-display); }
  .vf-card-sub   { color:#6B7280; font-size:12px; margin:0; line-height:1.55; }

  /* Amount display */
  .vf-amount { display:flex; align-items:baseline; gap:5px; margin-bottom:16px; }
  .vf-amount-n  { color:white; font-size:30px; font-weight:900; font-family:var(--font-display); line-height:1; }
  .vf-amount-cu { color:#6B7280; font-size:14px; font-weight:600; }
  .vf-amount-note { color:#374151; font-size:11px; margin-left:4px; }

  /* Payment method pills */
  .vf-methods { display:flex; gap:6px; margin-bottom:18px; flex-wrap:wrap; }
  .vf-method-pill {
    display:inline-flex; align-items:center; gap:4px;
    padding:4px 11px; border-radius:100px; font-size:11px; font-weight:600;
    border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04);
    color:#9CA3AF;
  }

  /* Buttons */
  .vf-btn {
    width:100%; padding:13px; border-radius:13px; font-size:14px; font-weight:700;
    cursor:pointer; border:none; display:flex; align-items:center; justify-content:center;
    gap:8px; transition:opacity 0.2s, transform 0.15s; text-decoration:none;
  }
  .vf-btn:hover:not([disabled]) { opacity:0.86; transform:translateY(-1px); }
  .vf-btn[disabled], .vf-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none; }
  .vf-btn-primary {
    background:linear-gradient(135deg,#1E5EFF,#4D82FF); color:white;
    box-shadow:0 8px 20px rgba(30,94,255,0.25);
  }
  .vf-btn-purple {
    background:linear-gradient(135deg,#7C3AED,#A855F7); color:white;
    box-shadow:0 8px 20px rgba(168,85,247,0.25);
  }
  .vf-btn-success {
    background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.28) !important;
    color:#22C55E; box-shadow:none;
  }
  .vf-note {
    font-size:11px; color:#374151; text-align:center; margin-top:12px; line-height:1.7;
  }

  /* Success state */
  .vf-success {
    text-align:center; padding:48px 28px 40px;
    background:#0C0E16; border:1px solid rgba(34,197,94,0.2);
    border-radius:20px;
  }
  .vf-success-ring {
    width:72px; height:72px; border-radius:50%; margin:0 auto 20px;
    background:rgba(34,197,94,0.1); border:2px solid rgba(34,197,94,0.3);
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 0 32px rgba(34,197,94,0.15);
  }
`

export default function VerifyForm({ profile }: { profile: VerifiedProfile }) {
  const [loading,     setLoading]     = useState(false)
  const [diditUrl,    setDiditUrl]    = useState<string | null>(null)
  const [payproUrl,   setPayproUrl]   = useState<string | null>(null)
  const [idDone]      = useState(profile.is_id_verified)
  const [paymentDone] = useState(profile.is_payment_verified)
  const [initiated,   setInitiated]   = useState(false)
  const [initError,   setInitError]   = useState('')

  const step = idDone && paymentDone ? 3 : idDone ? 2 : 1
  const stepState = (n: number) => step > n ? 'done' : step === n ? 'active' : 'idle'

  const handleInitiate = async () => {
    setLoading(true)
    setInitError('')
    const result = await initiateVerification()
    setLoading(false)
    if (result.error) { setInitError('Something went wrong. Please try again.'); return }
    setInitiated(true)
    if (result.diditSessionUrl)   setDiditUrl(result.diditSessionUrl)
    if (result.payproPaymentUrl)  setPayproUrl(result.payproPaymentUrl)
  }

  /* Fully verified */
  if (step === 3) {
    return (
      <>
        <style>{CSS}</style>
        <div className="vf-success">
          <div className="vf-success-ring">
            <CheckCircle2 size={34} color="#22C55E" />
          </div>
          <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
            Triple Verified
          </h2>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0, lineHeight: 1.65 }}>
            Your identity and payment have been verified.<br />
            You&apos;ve earned <strong style={{ color: '#FACC15' }}>+150 Social Score points</strong>.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="vf-wrap">

        {/* Step indicator */}
        <div className="vf-stepper">
          {[
            { label: 'ID Verify', n: 1 },
            { label: 'Payment',   n: 2 },
            { label: 'Verified',  n: 3 },
          ].map(({ label, n }, i, arr) => (
            <React.Fragment key={n}>
              <div className="vf-step">
                <div className={`vf-step-dot ${stepState(n)}`}>
                  {stepState(n) === 'done' ? <CheckCircle2 size={17} /> : n}
                </div>
                <span className={`vf-step-label ${stepState(n)}`}>{label}</span>
              </div>
              {i < arr.length - 1 && (
                <div
                  className={`vf-connector ${
                    step > n + 1 ? 'done' : step === n + 1 ? 'active' : 'idle'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 — Didit ID */}
        <div className="vf-card" style={idDone ? { borderColor: 'rgba(34,197,94,0.2)' } : {}}>
          <div className="vf-card-head">
            <div className="vf-card-icon" style={{
              background: idDone ? 'rgba(34,197,94,0.12)' : 'rgba(30,94,255,0.1)',
              borderColor: idDone ? 'rgba(34,197,94,0.25)' : 'rgba(30,94,255,0.2)',
            }}>
              <ShieldCheck size={18} color={idDone ? '#22C55E' : '#1E5EFF'} />
            </div>
            <div>
              <h3 className="vf-card-title">Identity Verification</h3>
              <p className="vf-card-sub">CNIC scan + passive liveness check via Didit</p>
            </div>
          </div>

          {initError && (
            <p style={{ color: '#F97316', fontSize: 12, padding: '8px 12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8, marginBottom: 10 }}>{initError}</p>
          )}
          {idDone ? (
            <button className="vf-btn vf-btn-success" disabled>
              <CheckCircle2 size={15} /> ID Verified
            </button>
          ) : !initiated ? (
            <button className="vf-btn vf-btn-primary" onClick={handleInitiate} disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
              {loading ? 'Setting up…' : 'Start ID Verification'}
            </button>
          ) : diditUrl ? (
            <a href={diditUrl} target="_blank" rel="noopener noreferrer" className="vf-btn vf-btn-primary">
              <ExternalLink size={15} /> Open ID Verification
            </a>
          ) : (
            <button className="vf-btn vf-btn-primary" disabled>
              <Loader2 size={15} className="animate-spin" /> Loading…
            </button>
          )}

          <p className="vf-note">
            Your CNIC data is processed by Didit and never stored on Tikkit servers.
          </p>
        </div>

        {/* Step 2 — PayPro Payment */}
        <div className={`vf-card${!initiated && !idDone ? ' locked' : ''}`} style={paymentDone ? { borderColor: 'rgba(34,197,94,0.2)' } : {}}>
          <div className="vf-card-head">
            <div className="vf-card-icon" style={{
              background: paymentDone ? 'rgba(34,197,94,0.12)' : 'rgba(124,58,237,0.12)',
              borderColor: paymentDone ? 'rgba(34,197,94,0.25)' : 'rgba(168,85,247,0.25)',
            }}>
              {paymentDone
                ? <CreditCard size={18} color="#22C55E" />
                : (!initiated && !idDone)
                  ? <Lock size={18} color="#4B5563" />
                  : <CreditCard size={18} color="#A855F7" />
              }
            </div>
            <div>
              <h3 className="vf-card-title">Signup Fee</h3>
              <p className="vf-card-sub">One-time verification fee — paid via PayPro</p>
            </div>
          </div>

          {/* Amount */}
          <div className="vf-amount">
            <span className="vf-amount-n">500</span>
            <span className="vf-amount-cu">PKR</span>
            <span className="vf-amount-note">· one-time · non-refundable</span>
          </div>

          {/* Accepted methods */}
          <div className="vf-methods">
            {PAYMENT_METHODS.map(m => (
              <span key={m} className="vf-method-pill">{m}</span>
            ))}
          </div>

          {paymentDone ? (
            <button className="vf-btn vf-btn-success" disabled>
              <CheckCircle2 size={15} /> Payment Verified
            </button>
          ) : payproUrl ? (
            <a href={payproUrl} target="_blank" rel="noopener noreferrer" className="vf-btn vf-btn-purple">
              <ExternalLink size={15} /> Pay PKR 500 via PayPro
            </a>
          ) : (
            <button className="vf-btn vf-btn-purple" disabled>
              {initiated ? 'Generating payment link…' : 'Complete ID verification first'}
            </button>
          )}

          <p className="vf-note">
            You&apos;ll be redirected to PayPro&apos;s secure payment page.
            Verification is confirmed automatically within a few minutes.
          </p>
        </div>

      </div>
    </>
  )
}
