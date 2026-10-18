'use client'

import { useEffect } from 'react'
import { initInstallCapture } from '@/lib/pwa'

/** Registers the service worker (production only, or when switched on for testing) and starts listening for the install offer. */
export default function PwaRegister() {
  useEffect(() => {
    initInstallCapture()
    if (!('serviceWorker' in navigator)) return
    let dev = false
    try { dev = localStorage.getItem('tkx-pwa-dev') === '1' } catch { /* storage blocked */ }
    if (process.env.NODE_ENV !== 'production' && !dev) return
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => { /* the site works without it */ })
  }, [])
  return null
}
