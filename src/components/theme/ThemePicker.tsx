'use client'

import { useTransition } from 'react'
import { Check } from 'lucide-react'
import { useTheme, type AppTheme } from './ThemeProvider'
import { updateTheme } from '@/app/actions/themeActions'

/* ── Theme definitions ──────────────────────────────────────────── */
const THEMES: {
  id: AppTheme
  name: string
  tagline: string
  bg: string
  sidebar: string
  surface: string
  surface2: string
  accent: string
  accent2: string
  text: string
  textMuted: string
  border: string
}[] = [
  {
    id: 'noir',
    name: 'Noir',
    tagline: 'Dark · Neon · Cinematic',
    bg: '#080A10',
    sidebar: '#0D0F18',
    surface: '#0C0E16',
    surface2: '#13151E',
    accent: '#1E5EFF',
    accent2: '#FFC745',
    text: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.35)',
    border: 'rgba(255,255,255,0.06)',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    tagline: 'Professional · Navy · Crisp',
    bg: '#0F1724',
    sidebar: '#1A2332',
    surface: '#1A2332',
    surface2: '#243447',
    accent: '#4A90D9',
    accent2: '#64B5F6',
    text: '#FFFFFF',
    textMuted: '#94A3B8',
    border: 'rgba(255,255,255,0.08)',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Warm · Earthy · Organic',
    bg: '#FAF8F5',
    sidebar: '#FFFFFF',
    surface: '#FFFFFF',
    surface2: '#F3EDE4',
    accent: '#4D6B3A',
    accent2: '#B85835',
    text: '#1C1A16',
    textMuted: '#8A8278',
    border: '#D5CEC4',
  },
]

/* ── Mini preview ───────────────────────────────────────────────── */
function ThemePreview({ t }: { t: typeof THEMES[number] }) {
  return (
    <div
      style={{
        height: 72,
        borderRadius: 8,
        overflow: 'hidden',
        background: t.bg,
        border: `1px solid ${t.border}`,
        display: 'flex',
        marginBottom: 10,
      }}
    >
      {/* Fake sidebar */}
      <div
        style={{
          width: 24,
          background: t.sidebar,
          borderRight: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 7,
          gap: 5,
        }}
      >
        {/* Logo dot */}
        <div style={{ width: 10, height: 10, borderRadius: 3, background: t.accent }} />
        {/* Nav items */}
        {[1, 1, 0.4, 0.4].map((opacity, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 3,
              borderRadius: 2,
              background: t.accent,
              opacity,
            }}
          />
        ))}
      </div>

      {/* Fake main content */}
      <div style={{ flex: 1, padding: '7px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Top bar */}
        <div
          style={{
            height: 10,
            borderRadius: 4,
            background: t.surface,
            border: `1px solid ${t.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 5px',
          }}
        >
          <div style={{ width: 24, height: 4, borderRadius: 2, background: t.accent, opacity: 0.6 }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent }} />
        </div>
        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {[t.accent, t.accent2, t.accent].map((color, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRadius: 4,
                background: t.surface2,
                border: `1px solid ${t.border}`,
                display: 'flex',
                alignItems: 'flex-end',
                padding: '0 4px 3px',
              }}
            >
              <div style={{ width: '100%', height: 3, borderRadius: 2, background: color, opacity: 0.7 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── ThemePicker ────────────────────────────────────────────────── */
export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()

  const handleSelect = (id: AppTheme) => {
    setTheme(id)
    startTransition(async () => {
      await updateTheme(id)
    })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {THEMES.map((t) => {
        const active = theme === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelect(t.id)}
            disabled={isPending}
            style={{
              position: 'relative',
              borderRadius: 12,
              padding: 12,
              border: `2px solid ${active ? t.accent : 'rgba(255,255,255,0.06)'}`,
              background: active
                ? `rgba(${t.id === 'pulse' ? '77,107,58' : t.id === 'corporate' ? '74,144,217' : '30,94,255'},0.08)`
                : 'rgba(255,255,255,0.02)',
              cursor: isPending ? 'default' : 'pointer',
              outline: 'none',
              transition: 'border-color 0.2s, background 0.2s',
              textAlign: 'left',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            <ThemePreview t={t} />

            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, color: active ? t.accent : 'inherit' }}>
              {t.name}
            </p>
            <p style={{ fontSize: 11, opacity: 0.5 }}>{t.tagline}</p>

            {active && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: t.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={10} color="white" strokeWidth={3} />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
