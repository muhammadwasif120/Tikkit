'use client'

import { ShieldCheck, CreditCard, Star, ShieldX, Lock } from 'lucide-react'

interface Props {
  isIdVerified:      boolean
  isPaymentVerified: boolean
  socialScore:       number
  size?:   'sm' | 'md' | 'lg'
  layout?: 'row' | 'column'
}

const CSS = `
  .vb-wrap { display:flex; flex-wrap:wrap; gap:7px; align-items:center; }
  .vb-wrap.column { flex-direction:column; align-items:flex-start; }

  .vb-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 11px; border-radius:100px;
    font-size:11px; font-weight:700; letter-spacing:0.03em;
    border:1px solid; white-space:nowrap; transition:opacity 0.15s;
  }
  .vb-badge.sm { padding:3px 8px; font-size:10px; gap:4px; }
  .vb-badge.lg { padding:6px 15px; font-size:13px; gap:7px; }

  .vb-verified {
    background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.28); color:#22C55E;
  }
  .vb-unverified {
    background:rgba(75,85,99,0.1); border-color:rgba(75,85,99,0.22); color:#4B5563;
  }
  .vb-score {
    background:rgba(250,204,21,0.09); border-color:rgba(250,204,21,0.28); color:#FACC15;
  }
`

export default function VerificationBadges({
  isIdVerified,
  isPaymentVerified,
  socialScore,
  size   = 'md',
  layout = 'row',
}: Props) {
  const s        = size === 'md' ? '' : size
  const iconSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12

  return (
    <>
      <style>{CSS}</style>
      <div className={`vb-wrap${layout === 'column' ? ' column' : ''}`}>

        {/* ID */}
        <span className={`vb-badge ${s} ${isIdVerified ? 'vb-verified' : 'vb-unverified'}`}>
          {isIdVerified ? <ShieldCheck size={iconSize} /> : <ShieldX size={iconSize} />}
          ID {isIdVerified ? 'Verified' : 'Unverified'}
        </span>

        {/* Payment */}
        <span className={`vb-badge ${s} ${isPaymentVerified ? 'vb-verified' : 'vb-unverified'}`}>
          {isPaymentVerified ? <CreditCard size={iconSize} /> : <Lock size={iconSize} />}
          Payment {isPaymentVerified ? 'Verified' : 'Unverified'}
        </span>

        {/* Social Score */}
        <span className={`vb-badge ${s} vb-score`}>
          <Star size={iconSize} fill="#FACC15" />
          {socialScore} pts
        </span>

      </div>
    </>
  )
}
