'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Phone, Mail, ZoomIn } from 'lucide-react'
import VerificationBadges from '@/components/verification/VerificationBadges'
import type { CommandAttendee } from '@/types/verification'

interface Props {
  attendee: CommandAttendee
  onApprove: (registrationId: string) => void
  onReject: (registrationId: string) => void
  actioning?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  pending:  '#FACC15',
  approved: '#22C55E',
  rejected: '#EF4444',
  waitlist: '#A855F7',
}

const CSS = `
  .ac-card {
    background:#0C0E16; border:1px solid rgba(255,255,255,0.07);
    border-radius:18px; overflow:hidden; transition:border-color 0.2s;
  }
  .ac-card:hover { border-color:rgba(255,255,255,0.12); }
  .ac-card.approved { border-color:rgba(34,197,94,0.2); }
  .ac-card.rejected { border-color:rgba(239,68,68,0.15); opacity:0.7; }

  .ac-header { padding:16px 18px 14px; display:flex; align-items:center; gap:12px; }
  .ac-avatar {
    width:44px; height:44px; border-radius:50%; flex-shrink:0;
    background:linear-gradient(135deg,rgba(30,94,255,0.3),rgba(168,85,247,0.2));
    display:flex; align-items:center; justify-content:center;
    font-size:16px; font-weight:800; color:white; font-family:var(--font-display);
    border:2px solid rgba(255,255,255,0.07);
  }
  .ac-name { color:white; font-size:14px; font-weight:800; margin:0 0 3px; font-family:var(--font-display); }
  .ac-meta { color:#6B7280; font-size:11px; margin:0; display:flex; align-items:center; gap:4px; }
  .ac-status {
    margin-left:auto; padding:3px 10px; border-radius:100px;
    font-size:10px; font-weight:800; letter-spacing:0.05em; text-transform:uppercase;
    border:1px solid; flex-shrink:0;
  }

  .ac-body { padding:0 18px 16px; }
  .ac-badges-row { margin-bottom:12px; }

  .ac-screenshot {
    position:relative; border-radius:12px; overflow:hidden;
    border:1px solid rgba(255,255,255,0.07); margin-bottom:14px;
    background:#080A10; cursor:pointer;
  }
  .ac-screenshot img { width:100%; max-height:180px; object-fit:cover; display:block; }
  .ac-screenshot-label {
    position:absolute; top:8px; left:8px;
    background:rgba(0,0,0,0.75); border-radius:6px;
    padding:2px 8px; font-size:10px; font-weight:700; color:#9CA3AF;
  }
  .ac-screenshot-zoom {
    position:absolute; bottom:8px; right:8px;
    background:rgba(0,0,0,0.75); border-radius:8px; padding:6px;
    color:#9CA3AF; cursor:pointer; border:none;
  }

  .ac-contact { display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
  .ac-contact-pill {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 10px; background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.07); border-radius:8px;
    font-size:11px; color:#9CA3AF;
  }

  .ac-actions { display:flex; gap:8px; }
  .ac-btn {
    flex:1; padding:9px 12px; border-radius:10px; font-size:12px; font-weight:700;
    cursor:pointer; border:1px solid; display:flex; align-items:center; justify-content:center; gap:6px;
    transition:opacity 0.15s, transform 0.15s;
  }
  .ac-btn:hover:not(:disabled) { opacity:0.85; transform:translateY(-1px); }
  .ac-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .ac-btn-approve { background:rgba(34,197,94,0.12); border-color:rgba(34,197,94,0.25); color:#22C55E; }
  .ac-btn-reject  { background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.2); color:#EF4444; }

  .ac-expand-btn {
    width:100%; padding:8px; background:none; border:none;
    border-top:1px solid rgba(255,255,255,0.05); color:#4B5563;
    font-size:11px; font-weight:600; cursor:pointer; display:flex;
    align-items:center; justify-content:center; gap:4px;
    transition:color 0.15s;
  }
  .ac-expand-btn:hover { color:#9CA3AF; }

  /* Lightbox */
  .ac-lightbox {
    position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.9);
    display:flex; align-items:center; justify-content:center; padding:24px;
    cursor:pointer;
  }
  .ac-lightbox img { max-width:100%; max-height:90vh; border-radius:12px; }
`

export default function ActionCard({ attendee, onApprove, onReject, actioning }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const initials = (attendee.full_name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const statusColor = STATUS_COLORS[attendee.status] ?? '#6B7280'
  const canAction = attendee.status === 'pending'

  return (
    <>
      <style>{CSS}</style>

      <div className={`ac-card ${attendee.status}`}>
        {/* Header row */}
        <div className="ac-header">
          <div className="ac-avatar">
            {attendee.avatar_url
              ? <img src={attendee.avatar_url} alt={attendee.full_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials
            }
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="ac-name">{attendee.full_name}</p>
            <p className="ac-meta">{attendee.email}</p>
          </div>
          <span
            className="ac-status"
            style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}12` }}
          >
            {attendee.status}
          </span>
        </div>

        {/* Verification badges */}
        <div className="ac-body">
          <div className="ac-badges-row">
            <VerificationBadges
              isIdVerified={attendee.is_id_verified}
              isPaymentVerified={attendee.is_payment_verified}
              socialScore={attendee.social_score}
              size="sm"
            />
          </div>

          {/* Expanded content */}
          {expanded && (
            <>
              {/* Contact info */}
              <div className="ac-contact">
                <span className="ac-contact-pill"><Mail size={10} /> {attendee.email}</span>
                {attendee.phone_number && (
                  <span className="ac-contact-pill"><Phone size={10} /> {attendee.phone_number}</span>
                )}
              </div>

              {/* P2P Screenshot */}
              {attendee.payment_screenshot_url && (
                <div className="ac-screenshot" onClick={() => setLightbox(true)}>
                  <img src={attendee.payment_screenshot_url} alt="Payment screenshot" />
                  <span className="ac-screenshot-label">Payment Screenshot</span>
                  <button className="ac-screenshot-zoom" onClick={e => { e.stopPropagation(); setLightbox(true) }}>
                    <ZoomIn size={14} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          {canAction && (
            <div className="ac-actions">
              <button
                className="ac-btn ac-btn-approve"
                onClick={() => onApprove(attendee.registration_id)}
                disabled={actioning}
              >
                <CheckCircle2 size={13} /> Approve
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
        <button className="ac-expand-btn" onClick={() => setExpanded(e => !e)}>
          {expanded ? <><ChevronUp size={12} /> Less</> : <><ChevronDown size={12} /> Details &amp; Screenshot</>}
        </button>
      </div>

      {/* Lightbox */}
      {lightbox && attendee.payment_screenshot_url && (
        <div className="ac-lightbox" onClick={() => setLightbox(false)}>
          <img src={attendee.payment_screenshot_url} alt="Payment screenshot" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
