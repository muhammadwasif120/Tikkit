import React from 'react'
import { AbsoluteFill, Series } from 'remotion'
import { Scene1Logo } from './scenes/Scene1Logo'
import { Scene2Problem } from './scenes/Scene2Problem'
import { Scene3CreateEvent } from './scenes/Scene3CreateEvent'
import { Scene4QRCheckin } from './scenes/Scene4QRCheckin'
import { Scene5Analytics } from './scenes/Scene5Analytics'
import { Scene6CTA } from './scenes/Scene6CTA'

export const TikkitDemo: React.FC = () => (
  <AbsoluteFill style={{ background: '#050505', fontFamily: 'DM Sans, Inter, sans-serif' }}>
    <Series>
      <Series.Sequence durationInFrames={90}>
        <Scene1Logo />
      </Series.Sequence>
      <Series.Sequence durationInFrames={240}>
        <Scene2Problem />
      </Series.Sequence>
      <Series.Sequence durationInFrames={390}>
        <Scene3CreateEvent />
      </Series.Sequence>
      <Series.Sequence durationInFrames={420}>
        <Scene4QRCheckin />
      </Series.Sequence>
      <Series.Sequence durationInFrames={360}>
        <Scene5Analytics />
      </Series.Sequence>
      <Series.Sequence durationInFrames={300}>
        <Scene6CTA />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
)
