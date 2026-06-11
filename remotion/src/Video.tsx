import React from 'react'
import { AbsoluteFill, Series } from 'remotion'
import { SceneProblem }   from './scenes/Scene1Problem'
import { SceneReveal }    from './scenes/Scene2Reveal'
import { SceneDashboard } from './scenes/Scene3Dashboard'
import { SceneCreate }    from './scenes/Scene4Create'
import { SceneScanner }   from './scenes/Scene5Scanner'
import { SceneAnalytics } from './scenes/Scene6Analytics'
import { SceneCTA }       from './scenes/Scene6CTA'

// Total: 72 + 54 + 180 + 90 + 120 + 90 + 114 = 720 frames = 24s @ 30fps
export const TikkitDemo: React.FC = () => (
  <AbsoluteFill style={{ background: '#000', fontFamily: '"DM Sans", "Inter", -apple-system, sans-serif' }}>
    <Series>
      {/* 3 hard-cut problem beats — 2.4s */}
      <Series.Sequence durationInFrames={72}><SceneProblem /></Series.Sequence>
      {/* Logo snap — 1.8s */}
      <Series.Sequence durationInFrames={54}><SceneReveal /></Series.Sequence>
      {/* Real dashboard — sidebar + stats + events list — 6s */}
      <Series.Sequence durationInFrames={180}><SceneDashboard /></Series.Sequence>
      {/* Create event form inside real dashboard shell — 3s */}
      <Series.Sequence durationInFrames={90}><SceneCreate /></Series.Sequence>
      {/* QR scanner inside real dashboard shell — 4s */}
      <Series.Sequence durationInFrames={120}><SceneScanner /></Series.Sequence>
      {/* Analytics — bar chart + real stats (₨280K, 94%) — 3s */}
      <Series.Sequence durationInFrames={90}><SceneAnalytics /></Series.Sequence>
      {/* CTA — "Your night. Your rules." — 3.8s */}
      <Series.Sequence durationInFrames={114}><SceneCTA /></Series.Sequence>
    </Series>
  </AbsoluteFill>
)
