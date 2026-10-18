'use client'

import { useSyncExternalStore } from 'react'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

/** Must match PAGES_CACHE in public/sw.js. Holds the saved guest pages, so it is deleted at sign out. */
export const PAGES_CACHE = 'tkx-pages-v2'

let deferred: InstallEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())

/** Start listening for the browser's install offer. Called once from the root layout. */
export function initInstallCapture() {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as InstallEvent; emit() })
  window.addEventListener('appinstalled', () => { deferred = null; installed = true; emit() })
}

export async function clearPrivateCaches() {
  try { await caches.delete(PAGES_CACHE) } catch { /* no Cache API */ }
}

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
const isIosSafari = () => isIos() && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)

export type InstallState = { standalone: boolean; canPrompt: boolean; iosSafari: boolean }
const SERVER: InstallState = { standalone: false, canPrompt: false, iosSafari: false }
let snapshot: InstallState = SERVER
const compute = (): InstallState => {
  const next = { standalone: installed || isStandalone(), canPrompt: !!deferred, iosSafari: isIosSafari() }
  if (next.standalone !== snapshot.standalone || next.canPrompt !== snapshot.canPrompt || next.iosSafari !== snapshot.iosSafari) snapshot = next
  return snapshot
}

export function useInstall() {
  const state = useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb) } }, compute, () => SERVER)
  return {
    ...state,
    async install() { if (!deferred) return false; await deferred.prompt(); const r = await deferred.userChoice; deferred = null; emit(); return r.outcome === 'accepted' },
  }
}
