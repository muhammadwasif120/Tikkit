import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

const problems = [
  { icon: '💬', title: 'Guest list on WhatsApp', sub: 'RSVPs in 12 different threads. No master list. No idea who confirmed.' },
  { icon: '💵', title: 'Cash at the door', sub: 'No receipt. No record. "Did he pay?" Nobody knows.' },
  { icon: '❓', title: 'Zero post-event data', sub: 'Event ends. How many showed? Leadership asks. You guess.' },
]

const Card: React.FC<{ item: typeof problems[0]; delay: number; frame: number; fps: number }> = ({ item, delay, frame, fps }) => {
  const localFrame = Math.max(0, frame - delay)
  const opacity = interpolate(localFrame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
  const y = interpolate(localFrame, [0, 25], [32, 0], { extrapolateRight: 'clamp' })
  const s = spring({ frame: localFrame, fps, config: { damping: 20, stiffness: 90 }, durationInFrames: 30 })

  return (
    <div style={{
      opacity,
      transform: `translateY(${y}px) scale(${s})`,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,59,48,0.25)',
      borderRadius: 20,
      padding: '32px 36px',
      display: 'flex', flexDirection: 'column', gap: 14,
      flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 36 }}>{item.icon}</span>
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: '#FF3B30', fontWeight: 800, flexShrink: 0,
        }}>✕</span>
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{item.title}</p>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{item.sub}</p>
    </div>
  )
}

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const headerOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' })
  const headerY = interpolate(frame, [0, 25], [20, 0], { extrapolateRight: 'clamp' })
  const exitOpacity = interpolate(frame, [200, 240], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 100px' }}>
      {/* Label */}
      <div style={{
        opacity: headerOpacity, transform: `translateY(${headerY}px)`,
        marginBottom: 20,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: '#FF3B30', padding: '6px 16px', borderRadius: 100,
        background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)',
      }}>
        Before Tikkit X
      </div>

      {/* Heading */}
      <h2 style={{
        opacity: headerOpacity, transform: `translateY(${headerY}px)`,
        fontSize: 52, fontWeight: 900, color: '#fff', textAlign: 'center',
        marginBottom: 56, lineHeight: 1.15, letterSpacing: '-1px',
      }}>
        Pakistani organisers were running<br />
        events on <span style={{ color: '#FF3B30' }}>hope and WhatsApp.</span>
      </h2>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 20, width: '100%' }}>
        {problems.map((p, i) => (
          <Card key={p.title} item={p} delay={30 + i * 22} frame={frame} fps={fps} />
        ))}
      </div>
    </AbsoluteFill>
  )
}
