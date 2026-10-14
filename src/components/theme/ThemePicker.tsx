'use client'

import { useTransition } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme, type AppTheme } from './ThemeProvider'
import { updateTheme } from '@/app/actions/themeActions'

const OPTIONS: { id: AppTheme; label: string; icon: typeof Moon }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
]

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
    <div
      style={{
        display: 'inline-flex',
        gap: 4,
        padding: 4,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--guest-border)',
      }}
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = theme === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleSelect(id)}
            disabled={isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--mist-400)',
              fontSize: 14,
              fontWeight: 600,
              cursor: isPending ? 'default' : 'pointer',
              opacity: isPending ? 0.7 : 1,
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
