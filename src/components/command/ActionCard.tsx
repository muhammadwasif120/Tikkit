'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Phone, Mail, ZoomIn, Loader2 } from 'lucide-react'
import VerificationBadges from '@/components/verification/VerificationBadges'
import type { CommandAttendee } from '@/types/verification'

interface Props {
  attendee: CommandAttendee
  onApprove: (registrationId: string) => void
  onReject:  (registrationId: string) => void
  actioning?: boolean
}

/* Status config */
const STATUS: Record<string, { color: string; label: string }> = {
  pending:         { color: '#FACC15', label: 'Pending'   },
  approved:        { color: '#22C55E', label: 'Approved'  },
  confirmed:       { color: '#22C55E', label: 'Confirmed' },
  checked_in:      { color: '#34D399', label: 'Checked In'},
  rejected:        { color: '#EF4444', label: 'Rejected'  },
  waitlist:        { color: '#A855F7', label: 'Waitlist'  },
  eoi_submitted:   { color: '#FACC15', label: 'EOI Sent'  },
  eoi_approved:    { color: '#22C55E', label: 'EOI Approved'},
  payment_pending: { color: '#818CF8', label: 'Pay Pending'},
}

/* Avatar gradient per initials */
const AVATAR_GRADS = [
  'linear-gradient(135deg,#1E5EFF,#818CF8)',
  'linear-gradient(135deg,#A855F7,#7C3AED)',
  'linear-gradient(135deg,#22C55E,#059669)',
  'linear-gradient(135deg,#F97316,#FACC15)',
  'linear-gradient(135deg,#06B6D4,#0EA5E9)',
]
function avatarGrad(name: string) {
  const code = (name ?? '?').charCodeAt(0)
  return AVATAR_GRADS[code % AVATAR_GRADS.length]
}

const CSS = `
  .ac-card {
    background:var(--guest-surface); border:1px solid var(--guest-border);
    border-radius:16px; overflow:hidden; transition:border-color 0.2s;
  }
  .ac-card:hover { border-color:var(--guest-border-hover); }
  .ac-card.approved, .ac-card.confirmed, .ac-card.checked_in {
    border-color:rgba(34,197,94,0.18);
  }
  .ac-card.rejected { border-color:rgba(239,68,68,0.12); opacity:0.65; }
  .ac-card.pending  { border-color:rgba(250,204,21,0.18); }

  /* Header */
  .ac-head { padding:14px 16px 12px; display:flex; align-items:center; gap:12px; }
  .ac-avatar {
    width:42px; height:42px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:15px; font-weight:900; color:white; font-family:var(--font-display);
    border:2px solid var(--guest-border);
  }
  .ac-name { color:var(--text-primary); font-size:14px; font-weight:800; margin:0 0 2px; font-family:var(--font-display); letter-spacing:-0.1px; }
  .ac-email { color:var(--text-muted); font-size:11px; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ac-status-pill {
    margin-left:auto; padding:3px 10px; border-radius:100px; flex-shrink:0;
    font-size:9px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase;
    border:1px solid;
  }

  /* Body */
  .ac-body { padding:0 16px 14px; }
  .ac-divider { height:1px; background:var(--guest-border); margin:0 0 12px; }

  /* Expanded content */
  .ac-contact { display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
  .ac-contact-pill {
    display:inline-flex; align-items:center; gap:4px;
    padding:4px 10px; background:var(--guest-surface-2);
    border:1px solid var(--guest-border); border-radius:8px;
    font-size:11px; color:var(--text-muted); white-space:nowrap;
  }

  /* Screenshot */
  .ac-screenshot {
    position:relative; border-radius:12px; overflow:hidden;
    border:1px solid var(--guest-border); margin-bottom:12px;
    background:var(--guest-bg); cursor:pointer;
  }
  .ac-screenshot img { width:100%; max-height:160px; object-fit:cover; display:block; }
  .ac-ss-label {
    position:absolute; top:8px; left:8px;
    background:rgba(0,0,0,0.8); border-radius:6px; backdrop-filter:blur(4px);
    padding:2px 8px; font-size:10px; font-weight:700; color:var(--text-muted);
  }
  .ac-ss-zoom {
    position:absolute; bottom:8px; right:8px;
    background:rgba(0,0,0,0.7); border-radius:8px; padding:6px;
    color:var(--text-muted); cursor:pointer; border:1px solid var(--guest-border);
    display:flex; align-items:center; justify-content:center;
    transition:color 0.15s;
  }
  .ac-ss-zoom:hover { color:var(--text-primary); }

  /* Actions */
  .ac-actions { display:flex; gap:8px; }
  .ac-btn {
    flex:1; padding:9px; border-radius:10px; font-size:12px; font-weight:700;
    cursor:pointer; border:1px solid; display:flex; align-items:center;
    justify-content:center; gap:6px; transition:opacity 0.15s, transform 0.15s;
  }
  .ac-btn:hover:not(:disabled) { opacity:0.82; transform:translateY(-1px); }
  .ac-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .ac-btn-approve { background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.25); color:#22C55E; }
  .ac-btn-reject  { background:rgba(239,68,68,0.07); border-color:rgba(239,68,68,0.18); color:#EF4444; }

  /* Expand toggle */
  .ac-toggle {
    width:100%; padding:8px; background:none; border:none;
    border-top:1px solid var(--guest-border); color:var(--text-muted);
    font-size:11px; font-weight:600; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:4px;
    transition:color 0.15s;
  }
  .ac-toggle:hover { color:var(--text-secondary); }

  /* Lightbox */
  .ac-lightbox {
    position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.92);
    backdrop-filter:blur(6px);
    display:flex; align-items:center; justify-content:center; padding:24px;
    cursor:pointer;
  }
  .ac-lightbox img { max-width:100%; max-height:90vh; border-radius:14px; box-shadow:0 24px 80px rgba(0,0,0,0.8); }
`

export default function ActionCard({ attendee, onApprove, onReject, actioning }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const initials  = (attendee.full_name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const st        = STATUS[attendee.status] ?? { color: '#6B7280', label: attendee.status }
  const canAction = attendee.status === 'pending'
  const grad      = avatarGrad(attendee.full_name ?? '')

  return (
    <>
      <style>{CSS}</style>

      <div className={`ac-card ${attendee.status}`}>

        {/* Header */}
        <div className="ac-head">
          <div className="ac-avatar" style={{ background: attendee.avatar_url ? 'transparent' : grad }}>
            {attendee.avatar_url
              ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={attendee.avatar_url} alt={attendee.full_name ?? ''} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                )
              : initials
            }
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="ac-name">{attendee.full_name}</p>
            <p className="ac-email">{attendee.email}</p>
          </div>
          <span
            className="ac-status-pill"
            style={{ color: st.color, borderColor: `${st.color}35`, background: `${st.color}10` }}
          >
            {st.label}
          </span>
        </div>

        {/* Badges + actions */}
        <div className="ac-body">
          <div className="ac-divider" />

          {/* Verification badges */}
          <div style={{ marginBottom: canAction ? 12 : 0 }}>
            <VerificationBadges
              isIdVerified={attendee.is_id_verified}
              isPaymentVerified={attendee.is_payment_verified}
              socialScore={attendee.social_score}
              size="sm"
            />
          </div>

          {/* Expanded: contact + screenshot */}
          {expanded && (
            <>
              <div style={{ marginTop: 12 }}>
                <div className="ac-contact">
                  <span className="ac-contact-pill"><Mail size={10} /> {attendee.email}</span>
                  {attendee.phone_number && (
                    <span className="ac-contact-pill"><Phone size={10} /> {attendee.phone_number}</span>
                  )}
                </div>

                {attendee.payment_screenshot_url && (
                  <div className="ac-screenshot" onClick={() => setLightbox(true)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attendee.payment_screenshot_url} alt="Payment screenshot" />
                    <span className="ac-ss-label">Payment Screenshot</span>
                    <button className="ac-ss-zoom" onClick={e => { e.stopPropagation(); setLightbox(true) }}>
                      <ZoomIn size={14} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Approve / Reject */}
          {canAction && (
            <div className="ac-actions" style={{ marginTop: expanded ? 0 : 12 }}>
              <button
                className="ac-btn ac-btn-approve"
                onClick={() => onApprove(attendee.registration_id)}
                disabled={actioning}
              >
                {actioning ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Approve
              </button>
              <button
                className="ac-btn ac-btn-reject"
                onClick={() => onReject(attendee.registration_id)}
                disabled={actioning}
              >
                <XCircle size={13} /> Reject
              </button>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button className="ac-toggle" onClick={() => setExpanded(e => !e)}>
          {expanded
            ? <><ChevronUp size={11} /> Less</>
            : <><ChevronDown size={11} /> Contact &amp; screenshot</>
          }
        </button>
      </div>

      {/* Lightbox */}
      {lightbox && attendee.payment_screenshot_url && (
        <div className="ac-lightbox" onClick={() => setLightbox(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attendee.payment_screenshot_url} alt="Payment" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
