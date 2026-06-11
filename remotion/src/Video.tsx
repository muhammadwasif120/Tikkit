import React from 'react'
import { AbsoluteFill, Series } from 'remotion'
import { SceneProblem } from './scenes/Scene1Problem'
import { SceneReveal } from './scenes/Scene2Reveal'
import { SceneCreate } from './scenes/Scene3Create'
import { SceneCheckin } from './scenes/Scene4Checkin'
import { SceneNumbers } from './scenes/Scene5Numbers'
import { SceneCTA } from './scenes/Scene6CTA'

export const TikkitDemo: React.FC = () => (
  <AbsoluteFill style={{ background: '#000', fontFamily: '"DM Sans", "Inter", -apple-system, sans-serif' }}>
    <Series>
      {/* 3 hard-cut problem beats — 24f each = 2.4s */}
      <Series.Sequence durationInFrames={72}><SceneProblem /></Series.Sequence>
      {/* Logo snap — 1.8s */}
      <Series.Sequence durationInFrames={54}><SceneReveal /></Series.Sequence>
      {/* Create event split — 5.5s */}
      <Series.Sequence durationInFrames={165}><SceneCreate /></Series.Sequence>
      {/* QR check-in split — 4s */}
      <Series.Sequence durationInFrames={120}><SceneCheckin /></Series.Sequence>
      {/* 3 stats full-bleed — 3s */}
      <Series.Sequence durationInFrames={90}><SceneNumbers /></Series.Sequence>
      {/* CTA — 7.3s */}
      <Series.Sequence durationInFrames={219}><SceneCTA /></Series.Sequence>
    </Series>
  </AbsoluteFill>
)
