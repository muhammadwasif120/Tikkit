'use client'

import { Zap, TrendingUp, TrendingDown, Star, Award, Target, Flame } from 'lucide-react'

type Profile = {
  credit_score: number
  total_attended: number
  total_no_shows: number
  total_vip_events: number
  attendance_streak: number
  longest_streak: number
} | null

type Transaction = {
  id: string
  type: string
  points: number
  balance_after: number
  note: string | null
  created_at: string
  event: { title: string; date_start: string } | null
}

function getTier(score: number) {
  if (score >= 1000) return { label: 'Elite',    color: '#FFC745', glow: 'rgba(255,199,69,0.2)',  next: null,  nextScore: null }
  if (score >= 500)  return { label: 'VIP',      color: '#A855F7', glow: 'rgba(168,85,247,0.2)', next: 'Elite', nextScore: 1000 }
  if (score >= 200)  return { label: 'Regular',  color: '#1E5EFF', glow: 'rgba(30,94,255,0.2)',  next: 'VIP', nextScore: 500 }
  if (score >= 50)   return { label: 'Rising',   color: '#22C55E', glow: 'rgba(34,197,94,0.2)',  next: 'Regular', nextScore: 200 }
  return               { label: 'Newcomer', color: '#6B7280', glow: 'rgba(107,114,128,0.2)', next: 'Rising', nextScore: 50 }
}

const TX_CONFIG: Record<string, { icon: typeof Zap; label: string; color: string }> = {
  exit_scan:         { icon: Zap,          label: 'Event attended',     color: '#22C55E' },
  vip_bonus:         { icon: Star,         label: 'VIP bonus',          color: '#FFC745' },
  first_event:       { icon: Award,        label: 'First event!',       color: '#4F8AFF' },
  streak_bonus:      { icon: Flame,        label: 'Streak bonus',       color: '#F97316' },
  no_show_deduction: { icon: TrendingDown, label: 'No-show deduction',  color: '#EF4444' },
  admin_adjustment:  { icon: Target,       label: 'Adjustment',         color: '#6B7280' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CreditsClient({ profile, transactions }: { profile: Profile; transactions: Transaction[] }) {
  const score = profile?.credit_score ?? 0
  const tier = getTier(score)

  // Progress to next tier
  const prevScore = score >= 1000 ? 500 : score >= 500 ? 200 : score >= 200 ? 50 : 0
  const progress = tier.nextScore
    ? Math.min(100, ((score - prevScore) / (tier.nextScore - prevScore)) * 100)
    : 100

  return (
    <div style={{ padding: '20px 18px 8px', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Zap size={13} color="#4F8AFF" />
          <span style={{ color: '#4F8AFF', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>SOCIAL CREDITS</span>
        </div>
        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.6px', margin: 0 }}>
          Your Score
        </h1>
      </div>

      {/* Score card */}
      <div style={{
        background: '#13151E',
        border: `1px solid ${tier.color}33`,
        borderRadius: 20, padding: '24px',
        marginBottom: 16, position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow blob */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          background: tier.glow, borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Tier badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 20,
            background: `${tier.color}18`, border: `1px solid ${tier.color}40`,
            marginBottom: 12,
          }}>
            <Star size={11} color={tier.color} fill={score >= 500 ? tier.color : 'none'} />
            <span style={{ color: tier.color, fontSize: 12, fontWeight: 700 }}>{tier.label}</span>
          </div>

          {/* Score number */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              fontSize: 52, fontWeight: 900, color: 'white',
              fontFamily: 'Poppins, sans-serif', letterSpacing: '-2px', lineHeight: 1,
            }}>
              {score.toLocaleString()}
            </span>
            <span style={{ color: '#4B5563', fontSize: 16, fontWeight: 600, marginLeft: 6 }}>pts</span>
          </div>

          {/* Progress to next tier */}
          {tier.nextScore && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#4B5563', fontSize: 12 }}>Progress to {tier.next}</span>
                <span style={{ color: '#6B7280', fontSize: 12 }}>
                  {(tier.nextScore - score).toLocaleString()} pts to go
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${tier.color}80, ${tier.color})`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )}
          {!tier.nextScore && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={13} color="#FFC745" fill="#FFC745" />
              <span style={{ color: '#FFC745', fontSize: 13, fontWeight: 600 }}>Maximum tier achieved</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Events Attended', value: profile?.total_attended ?? 0, icon: Zap, color: '#22C55E' },
          { label: 'Current Streak', value: profile?.attendance_streak ?? 0, icon: Flame, suffix: '🔥', color: '#F97316' },
          { label: 'VIP Events', value: profile?.total_vip_events ?? 0, icon: Star, color: '#FFC745' },
          { label: 'No-shows', value: profile?.total_no_shows ?? 0, icon: TrendingDown, color: '#EF4444' },
        ].map(({ label, value, icon: Icon, suffix, color }) => (
          <div key={label} style={{
            background: '#13151E', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '14px',
          }}>
            <Icon size={16} color={color} style={{ marginBottom: 8 }} />
            <p style={{ color: 'white', fontSize: 22, fontWeight: 800, fontFamily: 'Poppins, sans-serif', margin: '0 0 2px', letterSpacing: '-0.5px' }}>
              {value}{suffix}
            </p>
            <p style={{ color: '#4B5563', fontSize: 12, margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* How to earn */}
      <div style={{
        background: '#13151E', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '16px', marginBottom: 24,
      }}>
        <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>How to earn</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { action: 'Exit scan at any event',   pts: '+50', color: '#22C55E' },
            { action: 'VIP ticket + exit scan',    pts: '+100', color: '#FFC745' },
            { action: 'First event ever',          pts: '+100', color: '#4F8AFF' },
            { action: '3-event streak',            pts: '+25',  color: '#F97316' },
            { action: '5-event streak',            pts: '+50',  color: '#F97316' },
            { action: 'No-show (deduction)',       pts: '−20',  color: '#EF4444' },
          ].map(({ action, pts, color }) => (
            <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>{action}</span>
              <span style={{ color, fontSize: 13, fontWeight: 700 }}>{pts} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <p style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          Transaction history
        </p>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#374151', fontSize: 14, margin: 0 }}>No transactions yet — start attending events!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {transactions.map(tx => {
              const config = TX_CONFIG[tx.type] ?? TX_CONFIG.admin_adjustment
              const Icon = config.icon
              return (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'background 0.15s',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${config.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color={config.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#E5E7EB', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{config.label}</p>
                    {tx.event && (
                      <p style={{ color: '#4B5563', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.event.title}
                      </p>
                    )}
                    <p style={{ color: '#374151', fontSize: 11, margin: '2px 0 0' }}>{formatDate(tx.created_at)}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: tx.points > 0 ? '#22C55E' : '#EF4444', fontSize: 15, fontWeight: 800, margin: '0 0 2px' }}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </p>
                    <p style={{ color: '#374151', fontSize: 11, margin: 0 }}>{tx.balance_after.toLocaleString()} pts</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}