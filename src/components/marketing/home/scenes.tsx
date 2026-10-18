// Illustrated scenes for the home page. Pure SVG and CSS, no images to load.

/** Deterministic pseudo random numbers so server and client render the same stars. */
function rng(seed: number) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
}

export function Stars({ count = 34, className }: { count?: number; className?: string }) {
  const r = rng(7)
  const stars = Array.from({ length: count }, () => ({ x: r() * 100, y: r() * 70, s: 1 + r() * 2, d: 3 + r() * 4, delay: r() * 4 }))
  return (
    <div aria-hidden className={className}>
      {stars.map((t, i) => (
        <span key={i} className="k-twinkle absolute rounded-full bg-white" style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.s, height: t.s, ['--d' as string]: `${t.d}s`, ['--delay' as string]: `${t.delay}s` }} />
      ))}
    </div>
  )
}

/** City skyline with lit windows. fill is a CSS color, windows twinkle. */
export function Skyline({ fill = 'rgb(10 12 22)', windows = true, className }: { fill?: string; windows?: boolean; className?: string }) {
  const r = rng(21)
  const blocks = [[0, 150, 70], [70, 95, 56], [126, 170, 84], [210, 120, 60], [270, 190, 76], [346, 110, 90], [436, 160, 64], [500, 100, 80], [580, 180, 70], [650, 125, 92], [742, 150, 60], [802, 105, 78], [880, 175, 82], [962, 130, 70], [1032, 160, 88], [1120, 110, 64], [1184, 185, 80], [1264, 135, 70], [1334, 165, 106]]
  const lights: { x: number; y: number; d: number; delay: number; blink: boolean }[] = []
  if (windows) for (const [x, h, w] of blocks) for (let k = 0; k < Math.floor(h / 22); k++) for (let j = 0; j < Math.floor(w / 24); j++) if (r() > 0.55) lights.push({ x: x + 10 + j * 22, y: 240 - h + 14 + k * 20, d: 3 + r() * 5, delay: r() * 5, blink: r() > 0.88 })
  return (
    <svg aria-hidden viewBox="0 0 1440 240" preserveAspectRatio="xMidYMax slice" className={className}>
      {blocks.map(([x, h, w], i) => <rect key={i} x={x} y={240 - h} width={w} height={h} fill={fill} />)}
      {lights.map((l, i) => <rect key={i} x={l.x} y={l.y} width="8" height="10" rx="1.5" fill="#fbbf24" className={l.blink ? 'k-twinkle' : undefined} style={{ ['--d' as string]: `${l.d}s`, ['--delay' as string]: `${l.delay}s`, opacity: l.blink ? undefined : 0.75 }} />)}
    </svg>
  )
}

/** Rolling hills for the daylight horizon. */
export function Hills({ far = '#f6c98d', near = '#e9a96b', className }: { far?: string; near?: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 1440 260" preserveAspectRatio="none" className={className}>
      <path d="M0 150 C 180 70 340 70 520 140 S 900 210 1100 120 S 1360 90 1440 130 V260 H0Z" fill={far} />
      <path d="M0 200 C 220 140 420 150 640 200 S 1040 250 1240 190 S 1400 170 1440 190 V260 H0Z" fill={near} />
    </svg>
  )
}

export function Sun({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 400 400" className={className}>
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#fff3c4" stopOpacity="1" /><stop offset=".35" stopColor="#ffd37a" stopOpacity=".7" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient>
        <radialGradient id="sunCore" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#fffbe6" /><stop offset="1" stopColor="#ffc857" /></radialGradient>
      </defs>
      <circle cx="200" cy="200" r="200" fill="url(#sunGlow)" />
      <circle cx="200" cy="200" r="62" fill="url(#sunCore)" />
    </svg>
  )
}
