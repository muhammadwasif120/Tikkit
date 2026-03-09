'use client'

import { useEffect, useState } from 'react'
import { X, Share, PlusSquare, Download } from 'lucide-react'

type Platform = 'ios' | 'android' | null

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  // iOS Safari (not Chrome on iOS)
  if (/iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) return 'ios'
  // Android Chrome
  if (/Android/.test(ua) && /Chrome/.test(ua)) return 'android'
  return null
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

// Minimal share / arrow-up icon for iOS instructions
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  )
}

export default function AddToHomeScreen() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {/* silent */})
    }

    // Already installed as PWA → nothing to show
    if (isStandalone()) return

    const dismissed = localStorage.getItem('tikkit-aths-dismissed')
    if (dismissed) return

    const p = detectPlatform()
    setPlatform(p)

    // Android: listen for browser's native prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (p === 'android') setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS: show after a short delay (no native prompt available)
    if (p === 'ios') {
      const timer = setTimeout(() => setVisible(true), 3000)
      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        clearTimeout(timer)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem('tikkit-aths-dismissed', '1')
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prompt = deferredPrompt as any
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
      localStorage.setItem('tikkit-aths-dismissed', '1')
    }
    setInstalling(false)
    setDeferredPrompt(null)
  }

  if (!visible || !platform) return null

  return (
    <>
      {/* Backdrop blur overlay — subtle */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(8,10,16,0.4)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Banner */}
      <div
        style={{
          position: 'fixed',
          bottom: platform === 'ios' ? 88 : 96,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: 448,
          zIndex: 999,
          background: 'linear-gradient(135deg, #13151E 0%, #0D0F18 100%)',
          border: '1px solid rgba(30,94,255,0.3)',
          borderRadius: 20,
          padding: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(30,94,255,0.1)',
        }}
      >
        {/* Glow accent */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 160, height: 2, borderRadius: 2,
          background: 'linear-gradient(90deg, transparent, #1E5EFF, transparent)',
        }} />

        {/* Close button */}
        <button
          onClick={dismiss}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.06)', border: 'none',
            borderRadius: 8, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6B7280',
          }}
        >
          <X size={14} />
        </button>

        {/* Content */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingRight: 24 }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(30,94,255,0.15)',
            border: '1px solid rgba(30,94,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {platform === 'ios'
              ? <PlusSquare size={22} color="#1E5EFF" />
              : <Download size={22} color="#1E5EFF" />
            }
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 3px', lineHeight: 1.3 }}>
              Add Tikkit to your home screen
            </p>
            <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 12px', lineHeight: 1.5 }}>
              {platform === 'ios'
                ? 'Get quick access — no app store needed.'
                : 'Install for the full app experience.'}
            </p>

            {platform === 'ios' ? (
              /* iOS step-by-step instructions */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#9CA3AF' }}>
                    <ShareIcon />
                  </div>
                  <span style={{ color: '#9CA3AF', fontSize: 12 }}>Tap the <strong style={{ color: 'white' }}>Share</strong> button in Safari</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#9CA3AF' }}>
                    <Share size={13} />
                  </div>
                  <span style={{ color: '#9CA3AF', fontSize: 12 }}>Select <strong style={{ color: 'white' }}>"Add to Home Screen"</strong></span>
                </div>
              </div>
            ) : (
              /* Android: native install button */
              <button
                onClick={handleInstall}
                disabled={installing}
                style={{
                  width: '100%', padding: '10px 16px',
                  background: installing ? 'rgba(30,94,255,0.4)' : 'linear-gradient(135deg, #1E5EFF, #1448CC)',
                  border: 'none', borderRadius: 10,
                  color: 'white', fontSize: 13, fontWeight: 700,
                  cursor: installing ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: installing ? 'none' : '0 4px 12px rgba(30,94,255,0.35)',
                }}
              >
                <Download size={15} />
                {installing ? 'Installing…' : 'Add to Home Screen'}
              </button>
            )}
          </div>
        </div>

        {/* iOS: pointed arrow indicator */}
        {platform === 'ios' && (
          <div style={{
            position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(30,94,255,0.3)',
          }} />
        )}
      </div>
    </>
  )
}
