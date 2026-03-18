import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#080A10',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 7,
      }}
    >
      {/* T in cyan */}
      <span
        style={{
          fontFamily: '"Arial Black", "Impact", sans-serif',
          fontWeight: 900,
          fontSize: 17,
          color: '#00E5FF',
          letterSpacing: '-1.5px',
          lineHeight: 1,
          marginTop: 1,
        }}
      >
        T
      </span>
      {/* X in cyan with purple tint via color mix */}
      <span
        style={{
          fontFamily: '"Arial Black", "Impact", sans-serif',
          fontWeight: 900,
          fontSize: 21,
          color: '#B366FF',
          letterSpacing: '-1px',
          lineHeight: 1,
          marginTop: 1,
          marginLeft: -1,
        }}
      >
        X
      </span>
    </div>,
    { ...size }
  )
}
