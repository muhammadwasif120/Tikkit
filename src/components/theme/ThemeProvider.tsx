'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type AppTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: AppTheme
  setTheme: (t: AppTheme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The page itself is theme-neutral HTML; a script in <head> has already put the saved theme on <html> before paint.
  const [theme, setThemeState] = useState<AppTheme>('dark')

  useEffect(() => {
    const t = document.documentElement.dataset.theme
    if (t === 'light' || t === 'dark') setThemeState(t)
  }, [])

  const setTheme = (t: AppTheme) => {
    setThemeState(t)
    document.documentElement.dataset.theme = t
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
