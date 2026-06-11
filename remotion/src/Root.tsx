import React from 'react'
import { Composition } from 'remotion'
import { TikkitDemo } from './Video'

export const Root: React.FC = () => (
  <Composition
    id="TikkitDemo"
    component={TikkitDemo}
    durationInFrames={1800}
    fps={30}
    width={1920}
    height={1080}
  />
)
