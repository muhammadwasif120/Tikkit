import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

// Apple style: hard cuts, big type, 1.3s per beat
const beats = [
  { text: 'WhatsApp threads.', sub: 'Your guest list.' },
  { text: 'Cash at the door.', sub: 'Your revenue.' },
  { text: 'No idea who showed up.', sub: 'Your event.' },
]

const BEAT = 44 // frames per beat
const FADE = 5  // frames to fade in/out

function snap(f: number) {
  return interpolate(f, [0, FADE], [0, 1], { extrapolateRight: 'clamp' })
}

export const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame()

  // Overall fade out
  const exitOpacity = interpolate(frame, [135, 150], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {beats.map((beat, i) => {
        const start = i * BEAT
        const end = start + BEAT
        const localF = frame - start
        const visible = frame >= start && frame < end
        const opacity = visible
          ? snap(localF) * interpolate(localF, [BEAT - FADE, BEAT], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          : 0
        const y = interpolate(localF, [0, FADE * 1.5], [18, 0], { extrapolateRight: 'clamp' })

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              textAlign: 'center' as const,
              opacity,
              transform: `translateY(${y}px)`,
            }}
          >
            <p style={{
              fontSize: 16, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)',
              marginBottom: 20,
            }}>
              {beat.sub}
            </p>
            <h1 style={{
              fontSize: 96, fontWeight: 900, color: '#fff',
              letterSpacing: '-2px', lineHeight: 1,
            }}>
              {beat.text}
            </h1>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
