'use client'

import { useState } from 'react'
import { Zap, TrendingUp, TrendingDown, Award, Shield, ChevronRight, Star, Flame, Gem } from 'lucide-react'

/* ─── Types ──────────────────────────────────────────── */
type Transaction = {
  id: string
  amount: number
  type: string
  reason: string
  created_at: string
  event: { title: string; date_start: string } | null
}

type TierInfo = {
  name: string
  color: string
  minScore: number
  maxScore: number | null
  perks: string[]
}

/* ─── Tier config — aligned with creditUtils.ts ─────── */
const TIERS: TierInfo[] = [
  { name: 'Newcomer', color: '#6B7280', minScore: 0,    maxScore: 49,   perks: ['Basic access to public events', 'Collect attendance passes'] },
  { name: 'Rising',   color: '#22C55E', minScore: 50,   maxScore: 199,  perks: ['Priority waitlist placement', 'Early event notifications'] },
  { name: 'Regular',  color: '#1E5EFF', minScore: 200,  maxScore: 499,  perks: ['Early access to select events', 'Regular member badge'] },
  { name: 'VIP',      color: '#A855F7', minScore: 500,  maxScore: 999,  perks: ['Direct invites from organizers', 'VIP pass eligibility'] },
  { name: 'Elite',    color: '#FFC745', minScore: 1000, maxScore: null, perks: ['Auto-approved for all events', 'Lifetime platinum status'] },
]

function getTierIcon(name: string, size: number, color: string): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    Newcomer: <Award size={size} color={color} style={{ opacity: 0.5 }} />,
    Rising:   <Star  size={size} color={color} />,
    Regular:  <Flame size={size} color={color} />,
    VIP:      <Gem   size={size} color={color} />,
    Elite:    <Zap   size={size} color={color} />,
  }
  return map[name] ?? <Award size={size} color={color} />
}

function getTier(score: number): TierInfo {
  return [...TIERS].reverse().find(t => score >= t.minScore) ?? TIERS[0]
}

function getNextTier(score: number): TierInfo | null {
  return TIERS.find(t => score < t.minScore) ?? null
}

/* ─── Transaction row ────────────────────────────────── */
function TxRow({ tx }: { tx: Transaction }) {
  const isPositive = tx.amount > 0
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })

  const typeLabel: Record<string, string> = {
    exit_scan:        'Exit Scan',
    attendance_bonus: 'Attendance',
    no_show_penalty:  'No-show',
    manual_adjustment:'Adjustment',
    pass_bonus:       'Pass Bonus',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isPositive
          ? <TrendingUp size={16} color="#10B981" />
          : <TrendingDown size={16} color="#EF4444" />
        }
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>
          {typeLabel[tx.type] ?? tx.type}
        </p>
        <p style={{ color: '#4B5563', fontSize: 11, margin: 0 }}>
          {tx.event?.title ?? tx.reason}
          {tx.event && ` · ${fmtDate(tx.event.date_start)}`}
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{
          color: isPositive ? '#10B981' : '#EF4444',
          fontSize: 14, fontWeight: 800, margin: '0 0 2px',
          fontFamily: 'var(--font-display)',
        }}>
          {isPositive ? '+' : ''}{tx.amount}
        </p>
        <p style={{ color: '#4B5563', fontSize: 10, margin: 0 }}>{fmtTime(tx.created_at)}</p>
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────── */
export default function CreditsClient({
  profile,
  transactions,
}: {
  profile: { credit_score?: number | null } | null
  transactions: Transaction[]
}) {
  const score = profile?.credit_score ?? 0
  const [showTiers, setShowTiers] = useState(false)
  const tier = getTier(score)
  const nextTier = getNextTier(score)
  const progressPct = nextTier
    ? Math.min(100, ((score - tier.minScore) / (nextTier.minScore - tier.minScore)) * 100)
    : 100

  return (
    <div style={{ padding: '16px' }}>
      {/* Score card */}
      <div style={{
        background: `linear-gradient(135deg, ${tier.color}20 0%, #13151E 100%)`,
        border: `1px solid ${tier.color}30`,
        borderRadius: 20, padding: '24px 20px', marginBottom: 12,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `${tier.color}08` }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Credit Score
            </p>
            <p style={{
              color: 'white', fontSize: 48, fontWeight: 900,
              fontFamily: 'var(--font-display)',
              margin: 0, letterSpacing: '-2px', lineHeight: 1,
            }}>
              {score.toLocaleString()}
            </p>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `${tier.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getTierIcon(tier.name, 22, tier.color)}
            </div>
            <p style={{ color: tier.color, fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
              {tier.name}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {nextTier && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#6B7280', fontSize: 11 }}>{score} pts</span>
              <span style={{ color: '#6B7280', fontSize: 11 }}>
                {nextTier.minScore - score} pts to {nextTier.name}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                borderRadius: 3, transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )}
        {!nextTier && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10,
            background: `${tier.color}15`,
          }}>
            {getTierIcon(tier.name, 14, tier.color)}
            <span style={{ color: tier.color, fontSize: 12, fontWeight: 700 }}>Maximum tier reached!</span>
          </div>
        )}
      </div>

      {/* Perks for current tier */}
      <div style={{
        background: '#13151E', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '14px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Shield size={14} color={tier.color} />
            <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>Your Perks</span>
          </div>
          <button
            onClick={() => setShowTiers(!showTiers)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#1E5EFF', fontSize: 12, fontWeight: 600,
            }}
          >
            All tiers <ChevronRight size={13} style={{ transform: showTiers ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
        {tier.perks.map(perk => (
          <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: tier.color, flexShrink: 0 }} />
            <span style={{ color: '#9CA3AF', fontSize: 13 }}>{perk}</span>
          </div>
        ))}
      </div>

      {/* All tiers panel */}
      {showTiers && (
        <div style={{
          background: '#13151E', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '14px', marginBottom: 12,
        }}>
          <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 12px' }}>
            All Tiers
          </p>
          {TIERS.map(t => {
            const active = t.name === tier.name
            const locked = score < t.minScore
            return (
              <div key={t.name} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                opacity: locked ? 0.4 : 1,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {getTierIcon(t.name, 13, t.color)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ color: active ? t.color : 'white', fontSize: 13, fontWeight: 700 }}>{t.name}</span>
                    {active && (
                      <span style={{ padding: '1px 6px', borderRadius: 20, background: `${t.color}20`, color: t.color, fontSize: 9, fontWeight: 700 }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                  <span style={{ color: '#4B5563', fontSize: 11 }}>
                    {t.maxScore ? `${t.minScore}–${t.maxScore} pts` : `${t.minScore}+ pts`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transaction history */}
      <div style={{
        background: '#13151E', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '14px',
      }}>
        <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 4px' }}>
          History
        </p>
        {transactions.length === 0 ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#4B5563' }}>
            <Zap size={28} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p style={{ fontSize: 13, margin: 0 }}>No transactions yet</p>
          </div>
        ) : (
          transactions.map(tx => <TxRow key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  )
}
