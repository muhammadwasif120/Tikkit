import React from 'react'
import { AbsoluteFill, Series } from 'remotion'
import { SceneProblem } from './scenes/Scene1Problem'
import { SceneReveal } from './scenes/Scene2Reveal'
import { SceneCreate } from './scenes/Scene3Create'
import { SceneCheckin } from './scenes/Scene4Checkin'
import { SceneNumbers } from './scenes/Scene5Numbers'
import { SceneCTA } from './scenes/Scene6CTA'

// Shared font stack — DM Sans / system sans fallback
const FONT = '"DM Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif'

export { FONT }

export const TikkitDemo: React.FC = () => (
  <AbsoluteFill style={{ background: '#000', fontFamily: FONT }}>
    <Series>
      <Series.Sequence durationInFrames={150}><SceneProblem /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><SceneReveal /></Series.Sequence>
      <Series.Sequence durationInFrames={210}><SceneCreate /></Series.Sequence>
      <Series.Sequence durationInFrames={180}><SceneCheckin /></Series.Sequence>
      <Series.Sequence durationInFrames={150}><SceneNumbers /></Series.Sequence>
      <Series.Sequence durationInFrames={300}><SceneCTA /></Series.Sequence>
    </Series>
  </AbsoluteFill>
)
