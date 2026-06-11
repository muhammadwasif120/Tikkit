import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

// 3 hard cuts × 24 frames = 72 frames total (2.4s)
// Full-bleed widescreen — massive left-aligned type

const BEATS = [
  { eyebrow: 'Before Tikkit X',    line: 'WhatsApp\nthreads.',     accent: false },
  { eyebrow: 'Before Tikkit X',    line: 'Cash at\nthe door.',     accent: false },
  { eyebrow: 'Before Tikkit X',    line: 'No data.\nNo record.',   accent: true  },
]
const BF = 24 // frames per beat

export const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame()
  const beat = Math.min(2, Math.floor(frame / BF))
  const localF = frame % BF

  const data = BEATS[beat]

  // Super fast snap-in — 4 frames
  const textOpacity = interpolate(localF, [0, 4], [0, 1], { extrapolateRight: 'clamp' })
  const textY = interpolate(localF, [0, 5], [20, 0], { extrapolateRight: 'clamp' })

  // Subtle red slash accent — left edge bar
  const barH = interpolate(localF, [0, 6], [0, 100], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#000', display: 'flex', alignItems: 'center' }}>
      {/* Left edge bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0,
        width: 5, height: `${barH}%`,
        background: 'linear-gradient(180deg, #FF3B30, transparent)',
        transition: 'none',
      }} />

      {/* Content — left-aligned, pushed to left third */}
      <div style={{ paddingLeft: 140, paddingRight: 60, maxWidth: 1100 }}>
        <p style={{
          fontSize: 15, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase' as const, color: '#FF3B30',
          marginBottom: 28,
          opacity: textOpacity,
        }}>
          {data.eyebrow}
        </p>
        <h1 style={{
          fontSize: 180,
          fontWeight: 900,
          color: data.accent ? 'rgba(255,255,255,0.25)' : '#fff',
          lineHeight: 0.92,
          letterSpacing: '-6px',
          whiteSpace: 'pre-line' as const,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}>
          {data.line}
        </h1>
      </div>

      {/* Beat counter — bottom right */}
      <div style={{
        position: 'absolute', bottom: 52, right: 80,
        display: 'flex', gap: 8,
      }}>
        {BEATS.map((_, i) => (
          <div key={i} style={{
            width: i === beat ? 28 : 8, height: 4, borderRadius: 2,
            background: i === beat ? '#FF3B30' : 'rgba(255,255,255,0.15)',
            transition: 'none',
          }} />
        ))}
      </div>
    </AbsoluteFill>
  )
}
