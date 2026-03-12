/* ─── CyberLoader ────────────────────────────────────────────────────
   Full-page cyberpunk loading screen.
   Use as a Suspense fallback for guest pages that have no skeleton.
────────────────────────────────────────────────────────────────────── */
export default function CyberLoader() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100svh', gap: 28,
      background: '#080A10', position: 'relative', overflow: 'hidden',
    }}>

      {/* Subtle grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(30,94,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30,94,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Spinning rings */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>

        {/* Outer ring — clockwise */}
        <svg
          width="80" height="80"
          style={{ position: 'absolute', inset: 0, animation: 'spin 2.4s linear infinite' }}
        >
          <defs>
            <linearGradient id="outerG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#1E5EFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="36"
            fill="none" stroke="url(#outerG)"
            strokeWidth="2" strokeDasharray="72 154"
            strokeLinecap="round"
          />
        </svg>

        {/* Middle ring — counter-clockwise */}
        <svg
          width="80" height="80"
          style={{ position: 'absolute', inset: 0, animation: 'spin 1.6s linear infinite reverse' }}
        >
          <defs>
            <linearGradient id="midG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#A855F7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1E5EFF" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="26"
            fill="none" stroke="url(#midG)"
            strokeWidth="1.5" strokeDasharray="36 128"
            strokeLinecap="round"
          />
        </svg>

        {/* Inner dot ring — clockwise fast */}
        <svg
          width="80" height="80"
          style={{ position: 'absolute', inset: 0, animation: 'spin 0.9s linear infinite' }}
        >
          <circle cx="40" cy="40" r="16"
            fill="none" stroke="rgba(30,94,255,0.4)"
            strokeWidth="1" strokeDasharray="8 92"
            strokeLinecap="round"
          />
        </svg>

        {/* Center glow + T */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(30,94,255,0.3) 0%, transparent 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'cyberPulse 1.6s ease-in-out infinite',
          }}>
            <span style={{
              color: 'white', fontSize: 14, fontWeight: 900,
              fontFamily: 'var(--font-display)', letterSpacing: '-0.5px',
              textShadow: '0 0 12px rgba(30,94,255,0.9), 0 0 24px rgba(168,85,247,0.5)',
            }}>T</span>
          </div>
        </div>
      </div>

      {/* Label + dots */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <p style={{
          color: 'rgba(30,94,255,0.9)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.45em', margin: 0, fontFamily: 'var(--font-display)',
          textShadow: '0 0 16px rgba(30,94,255,0.6)',
        }}>LOADING</p>

        {/* Bouncing dots */}
        <div style={{ display: 'flex', gap: 5 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: i === 1 ? '#A855F7' : '#1E5EFF',
              animation: `pulseDot 1.1s ease-in-out ${i * 0.18}s infinite`,
              boxShadow: i === 1
                ? '0 0 6px rgba(168,85,247,0.8)'
                : '0 0 6px rgba(30,94,255,0.8)',
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes cyberPulse {
          0%, 100% { transform: scale(1);    opacity: 0.9; }
          50%       { transform: scale(1.15); opacity: 1;   }
        }
      `}</style>
    </div>
  )
}
