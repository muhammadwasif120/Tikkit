'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type AppTheme = 'noir' | 'corporate' | 'pulse'

type ThemeContextValue = {
  theme: AppTheme
  setTheme: (t: AppTheme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'noir',
  setTheme: () => {},
})

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode
  initialTheme: AppTheme
}) {
  const [theme, setThemeState] = useState<AppTheme>(initialTheme)

  // Sync to DOM immediately — avoids flash of wrong theme on hydration
  useEffect(() => {
    document.documentElement.dataset.theme = initialTheme
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
