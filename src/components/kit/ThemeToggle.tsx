'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme/ThemeProvider'
import { updateTheme } from '@/app/actions/themeActions'
import { Button } from './Button'

/** Light/dark switch. Applies instantly, then saves the choice if signed in. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={`Switch to ${next} mode`}
      onClick={() => {
        setTheme(next)
        void updateTheme(next).catch(() => {})
      }}
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
    </Button>
  )
}
