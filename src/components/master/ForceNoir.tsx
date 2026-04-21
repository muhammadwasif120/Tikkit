'use client'

import { useEffect } from 'react'

/**
 * Forces data-theme="noir" on <html> while any master page is mounted,
 * then restores the original theme on unmount.
 */
export default function ForceNoir() {
  useEffect(() => {
    const html = document.documentElement
    const prev = html.dataset.theme ?? ''
    html.dataset.theme = 'noir'
    return () => {
      if (prev) html.dataset.theme = prev
      else delete html.dataset.theme
    }
  }, [])

  return null
}
