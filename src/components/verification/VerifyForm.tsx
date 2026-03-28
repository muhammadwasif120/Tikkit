'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  ShieldCheck, Upload, CheckCircle2, Loader2, AlertCircle,
  FileImage, RotateCcw, Eye, EyeOff, Info,
} from 'lucide-react'
import { submitCnicVerification } from '@/app/actions/cnicActions'
import type { CnicProfile } from '@/app/actions/cnicActions'

// ─── Watermark helper ─────────────────────────────────────────────────────────
// Bakes "TIKKIT X" diagonal pattern onto the image client-side before uploading
async function applyWatermark(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      // Diagonal repeating watermark
      ctx.save()
      ctx.font = `bold ${Math.max(20, Math.round(img.naturalWidth / 18))}px sans-serif`
      ctx.fillStyle = 'rgba(0, 180, 255, 0.28)'
      ctx.globalAlpha = 1
      const step = Math.round(img.naturalWidth / 3.5)
      const angle = -Math.PI / 7
      for (let row = -img.naturalHeight; row < img.naturalHeight * 2; row += step) {
        for (let col = -img.naturalWidth; col < img.naturalWidth * 2; col += step * 1.8) {
          ctx.save()
          ctx.translate(col, row)
          ctx.rotate(angle)
          ctx.fillText('TIKKIT X', 0, 0)
          ctx.restore()
        }
      }
      ctx.restore()
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = reject
    img.src = url
  })
}

// ─── OCR helper ───────────────────────────────────────────────────────────────
// Dynamically loads Tesseract.js and extracts CNIC number + expiry from image
async function runOcr(file: File): Promise<{ cnicNumber: string; cnicExpiry: string }> {
  const result = { cnicNumber: '', cnicExpiry: '' }
  try {
    // Dynamic import so the ~3MB bundle only loads on this page
    const Tesseract = (await import('tesseract.js')).default
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: () => {},
    })

    // CNIC number: XXXXX-XXXXXXX-X
    const cnicMatch = text.match(/\b(\d{5})[- ]?(\d{7})[- ]?(\d{1})\b/)
    if (cnicMatch) {
      result.cnicNumber = `${cnicMatch[1]}-${cnicMatch[2]}-${cnicMatch[3]}`
    }

    // Expiry date: DD.MM.YYYY or DD/MM/YYYY or DDMMYYYY
    const expiryMatch = text.match(/(\d{2})[./\-](\d{2})[./\-](\d{4})/)
    if (expiryMatch) {
      result.cnicExpiry = `${expiryMatch[1]}.${expiryMatch[2]}.${expiryMatch[3]}`
    }
  } catch {
    // OCR failure is non-fatal — user can enter manually
  }
  return result
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
  .vf-wrap { width: 100%; }

  .vf-step-indicator {
    display: flex; align-items: center; margin-bottom: 28px;
  }
  .vf-step-dot {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; border: 2px solid; transition: all 0.25s;
    flex-shrink: 0;
  }
  .vf-step-dot.active { background: #1E5EFF; border-color: #1E5EFF; color: white; box-shadow: 0 0 16px rgba(30,94,255,0.4); }
  .vf-step-dot.done   { background: rgba(34,197,94,0.15); border-color: #22C55E; color: #22C55E; }
  .vf-step-dot.idle   { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.1); color: #374151; }
  .vf-step-label { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; margin-top: 5px; }
  .vf-step-label.active { color: #F0F2FF; }
  .vf-step-label.done   { color: #22C55E; }
  .vf-step-label.idle   { color: #374151; }
  .vf-connector { flex: 1; height: 2px; margin: 0 6px 20px; border-radius: 2px; }
  .vf-connector.done   { background: rgba(34,197,94,0.4); }
  .vf-connector.active { background: linear-gradient(90deg,rgba(34,197,94,0.4),rgba(30,94,255,0.35)); }
  .vf-connector.idle   { background: rgba(255,255,255,0.06); }

  .vf-card {
    background: #0C0E16; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px; padding: 22px; margin-bottom: 14px;
  }

  .vf-dropzone {
    border: 2px dashed rgba(255,255,255,0.1); border-radius: 14px;
    padding: 36px 24px; text-align: center; cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    background: rgba(255,255,255,0.01);
  }
  .vf-dropzone:hover, .vf-dropzone.drag { border-color: rgba(30,94,255,0.5); background: rgba(30,94,255,0.04); }
  .vf-dropzone.has-file { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.03); border-style: solid; }

  .vf-preview-wrap {
    position: relative; border-radius: 12px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08); background: #080A10;
  }
  .vf-preview-img { width: 100%; display: block; border-radius: 12px; }

  .vf-input-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .vf-label { font-size: 11px; font-weight: 700; color: #6B7280; letter-spacing: 0.06em; text-transform: uppercase; }
  .vf-input {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px; padding: 11px 14px; color: white; font-size: 14px;
    font-family: var(--font-display); width: 100%; outline: none;
    transition: border-color 0.2s;
  }
  .vf-input:focus { border-color: rgba(30,94,255,0.5); }
  .vf-input.ok    { border-color: rgba(34,197,94,0.4); }
  .vf-input.err   { border-color: rgba(239,68,68,0.4); }

  .vf-btn {
    width: 100%; padding: 13px; border-radius: 13px; font-size: 14px; font-weight: 700;
    cursor: pointer; border: none; display: flex; align-items: center; justify-content: center;
    gap: 8px; transition: opacity 0.2s, transform 0.15s; font-family: var(--font-display);
  }
  .vf-btn:hover:not(:disabled) { opacity: 0.86; transform: translateY(-1px); }
  .vf-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
  .vf-btn-primary { background: linear-gradient(135deg,#1E5EFF,#4D82FF); color: white; box-shadow: 0 8px 20px rgba(30,94,255,0.25); }
  .vf-btn-ghost   { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08) !important; color: #9CA3AF; }
  .vf-btn-success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25) !important; color: #22C55E; }

  .vf-error { color: #F97316; font-size: 12px; padding: 9px 12px; background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.2); border-radius: 9px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .vf-note  { font-size: 11px; color: #374151; text-align: center; margin-top: 12px; line-height: 1.7; }
  .vf-ocr-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: #FFC745; background: rgba(255,199,69,0.08); border: 1px solid rgba(255,199,69,0.2); padding: 2px 8px; border-radius: 99px; margin-bottom: 6px; }
  .vf-manual-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: #6B7280; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 99px; margin-bottom: 6px; }

  .vf-success {
    text-align: center; padding: 48px 28px 40px;
    background: #0C0E16; border: 1px solid rgba(34,197,94,0.2); border-radius: 20px;
  }
  .vf-pending {
    text-align: center; padding: 40px 28px;
    background: #0C0E16; border: 1px solid rgba(255,199,69,0.2); border-radius: 20px;
  }
`

// ─── Component ────────────────────────────────────────────────────────────────

type Step = 'upload' | 'review' | 'submitting' | 'done'

export default function VerifyForm({ profile }: { profile: CnicProfile }) {
  const [step, setStep] = useState<Step>(
    profile.cnic_status === 'pending' || profile.cnic_status === 'verified' ? 'done' : 'upload'
  )
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')    // watermarked preview
  const [watermarkedDataUrl, setWatermarkedDataUrl] = useState<string>('')
  const [cnicNumber, setCnicNumber] = useState(profile.cnic_number ?? '')
  const [cnicExpiry, setCnicExpiry]   = useState(profile.cnic_expiry ?? '')
  const [ocrSource, setOcrSource]     = useState<'auto' | 'manual'>('manual')
  const [ocrRunning, setOcrRunning]   = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const cnicOk = /^\d{5}-\d{7}-\d$/.test(cnicNumber.trim())
  const expiryOk = /^\d{2}\.\d{2}\.\d{4}$/.test(cnicExpiry.trim())

  const processFile = useCallback(async (f: File) => {
    setError('')
    setFile(f)
    setOcrRunning(true)
    setCnicNumber('')
    setCnicExpiry('')
    setOcrSource('manual')

    // Apply watermark (bake into image for storage)
    const wm = await applyWatermark(f)
    setWatermarkedDataUrl(wm)
    setPreviewUrl(wm)

    // Run OCR on the original (unblurred) file
    const { cnicNumber: num, cnicExpiry: exp } = await runOcr(f)
    if (num) { setCnicNumber(num); setOcrSource('auto') }
    if (exp) { setCnicExpiry(exp) }
    setOcrRunning(false)
    setStep('review')
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) processFile(f)
  }

  const handleSubmit = async () => {
    if (!cnicOk) { setError('Enter your CNIC number in the format: XXXXX-XXXXXXX-X'); return }
    if (!expiryOk) { setError('Enter the expiry date in the format: DD.MM.YYYY'); return }
    if (!watermarkedDataUrl) { setError('Please upload your CNIC image first.'); return }

    setStep('submitting')
    setError('')

    const res = await submitCnicVerification({
      imageDataUrl: watermarkedDataUrl,
      cnicNumber: cnicNumber.trim(),
      cnicExpiry: cnicExpiry.trim(),
    })

    if (res.error) {
      setError(res.error)
      setStep('review')
    } else {
      setStep('done')
    }
  }

  const reset = () => {
    setFile(null); setPreviewUrl(''); setWatermarkedDataUrl('')
    setCnicNumber(''); setCnicExpiry(''); setError('')
    setStep('upload'); setOcrSource('manual')
    if (inputRef.current) inputRef.current.value = ''
  }

  const currentStep = step === 'upload' ? 1 : step === 'review' || step === 'submitting' ? 2 : 3
  const stepState = (n: number) => currentStep > n ? 'done' : currentStep === n ? 'active' : 'idle'

  // ── Pending/verified state ──
  if (step === 'done' || profile.cnic_status === 'pending' || profile.cnic_status === 'verified') {
    return (
      <>
        <style>{CSS}</style>
        {profile.cnic_status === 'verified' ? (
          <div className="vf-success">
            <div style={{ width: 68, height: 68, borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(34,197,94,0.15)' }}>
              <CheckCircle2 size={32} color="#22C55E" />
            </div>
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>Identity Verified</h2>
            <p style={{ color: '#6B7280', fontSize: 13, margin: 0, lineHeight: 1.65 }}>
              Your CNIC has been verified.<br />
              <strong style={{ color: '#FACC15' }}>+100 Social Score</strong> awarded.
            </p>
          </div>
        ) : (
          <div className="vf-pending">
            <div style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto 18px', background: 'rgba(255,199,69,0.1)', border: '2px solid rgba(255,199,69,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={26} color="#FFC745" />
            </div>
            <h2 style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>Under Review</h2>
            <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 16px', lineHeight: 1.65 }}>
              Your CNIC has been submitted and is being reviewed by our team. This usually takes 1–2 business days.
            </p>
            {profile.cnic_number && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 99, padding: '5px 14px' }}>
                <ShieldCheck size={12} color="#6B7280" />
                <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>{profile.cnic_number}</span>
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="vf-wrap">

        {/* Step indicator */}
        <div className="vf-step-indicator">
          {[
            { label: 'Upload',  n: 1 },
            { label: 'Review',  n: 2 },
            { label: 'Done',    n: 3 },
          ].map(({ label, n }, i, arr) => (
            <React.Fragment key={n}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div className={`vf-step-dot ${stepState(n)}`}>
                  {stepState(n) === 'done' ? <CheckCircle2 size={16} /> : n}
                </div>
                <span className={`vf-step-label ${stepState(n)}`}>{label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`vf-connector ${stepState(n) === 'done' ? 'done' : stepState(n) === 'active' ? 'active' : 'idle'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="vf-error">
            <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className="vf-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(30,94,255,0.1)', border: '1px solid rgba(30,94,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={18} color="#1E5EFF" />
              </div>
              <div>
                <h3 style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: '0 0 2px', fontFamily: 'var(--font-display)' }}>CNIC Verification</h3>
                <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>Upload a clear photo of your CNIC (front side)</p>
              </div>
            </div>

            {/* Dropzone */}
            <div
              className={`vf-dropzone${drag ? ' drag' : ''}`}
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
            >
              <FileImage size={32} color="#374151" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#9CA3AF', fontSize: 14, fontWeight: 600, margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>
                Tap to upload or drag your CNIC here
              </p>
              <p style={{ color: '#374151', fontSize: 12, margin: 0 }}>JPG, PNG or WEBP · Max 10 MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Info note */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
              <Info size={13} color="#4B5563" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: '#4B5563', margin: 0, lineHeight: 1.65 }}>
                Your CNIC image is stored with a <strong style={{ color: '#6B7280' }}>Tikkit X watermark</strong> to prevent misuse. It is only accessible to our verification team and is never shared.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: Review ── */}
        {(step === 'review' || step === 'submitting') && file && (
          <div className="vf-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>Review & Confirm</h3>
              <button onClick={reset} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <RotateCcw size={12} /> Reupload
              </button>
            </div>

            {/* Image preview */}
            <div className="vf-preview-wrap" style={{ marginBottom: 20 }}>
              {showPreview ? (
                <img src={previewUrl} alt="CNIC preview" className="vf-preview-img" />
              ) : (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080A10' }}>
                  <p style={{ color: '#374151', fontSize: 12 }}>Preview hidden</p>
                </div>
              )}
              <button
                onClick={() => setShowPreview(v => !v)}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', color: '#9CA3AF', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                {showPreview ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* OCR results */}
            <div className="vf-input-row">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="vf-label">CNIC Number</label>
                {ocrRunning ? (
                  <span className="vf-ocr-badge"><Loader2 size={9} className="animate-spin" /> Scanning…</span>
                ) : ocrSource === 'auto' && cnicNumber ? (
                  <span className="vf-ocr-badge">✦ Auto-detected</span>
                ) : (
                  <span className="vf-manual-badge">Enter manually</span>
                )}
              </div>
              <input
                className={`vf-input${cnicNumber && cnicOk ? ' ok' : cnicNumber && !cnicOk ? ' err' : ''}`}
                placeholder="XXXXX-XXXXXXX-X"
                value={cnicNumber}
                onChange={e => { setCnicNumber(e.target.value); setOcrSource('manual') }}
              />
              {cnicNumber && !cnicOk && (
                <span style={{ fontSize: 11, color: '#EF4444' }}>Format must be: XXXXX-XXXXXXX-X</span>
              )}
            </div>

            <div className="vf-input-row">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="vf-label">Expiry Date</label>
                {ocrRunning ? (
                  <span className="vf-ocr-badge"><Loader2 size={9} className="animate-spin" /> Scanning…</span>
                ) : ocrSource === 'auto' && cnicExpiry ? (
                  <span className="vf-ocr-badge">✦ Auto-detected</span>
                ) : (
                  <span className="vf-manual-badge">Enter manually</span>
                )}
              </div>
              <input
                className={`vf-input${cnicExpiry && expiryOk ? ' ok' : cnicExpiry && !expiryOk ? ' err' : ''}`}
                placeholder="DD.MM.YYYY"
                value={cnicExpiry}
                onChange={e => { setCnicExpiry(e.target.value); setOcrSource('manual') }}
              />
              {cnicExpiry && !expiryOk && (
                <span style={{ fontSize: 11, color: '#EF4444' }}>Format must be: DD.MM.YYYY</span>
              )}
            </div>

            <button
              className="vf-btn vf-btn-primary"
              onClick={handleSubmit}
              disabled={step === 'submitting' || !cnicOk || !expiryOk || ocrRunning}
            >
              {step === 'submitting'
                ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                : <><Upload size={15} /> Submit for Verification</>}
            </button>

            <p className="vf-note">
              Our team will review your CNIC within 1–2 business days.<br />
              You&apos;ll receive a notification once verified.
            </p>
          </div>
        )}

      </div>
    </>
  )
}
