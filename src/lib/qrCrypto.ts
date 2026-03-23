// QR token crypto - works on both server (Node 18+) and browser (Web Crypto API)

export interface QRPayload {
  gid: string        // guest_id
  eid: string        // event_id
  name: string       // attendee display name
  days: string[] | null  // ticket_days (YYYY-MM-DD) or null for all-day access
  status: string     // registration status
  iat: number        // issued at (unix seconds)
  exp: number        // expires at (unix seconds)
}

// Derive a per-event HMAC key from master secret + event_id
// Server calls this to sign; scanner client caches the exported key
export async function deriveEventKey(masterSecret: string, eventId: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(masterSecret), { name: 'HKDF' }, false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode(eventId), info: enc.encode('tikkit-qr-v1') },
    baseKey,
    { name: 'HMAC', hash: 'SHA-256' },
    true,  // extractable so we can export for client caching
    ['sign', 'verify']
  )
}

export async function exportKeyBase64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(raw as ArrayBuffer)))
}

export async function importKeyBase64(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
}

function b64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromb64url(b64u: string): string {
  const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/')
  return atob(b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '='))
}

export async function signQRPayload(payload: QRPayload, key: CryptoKey): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'TQRV1' }))
  const body = b64url(JSON.stringify(payload))
  const data = `${header}.${body}`
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  const sigB64u = b64url(String.fromCharCode(...new Uint8Array(sig)))
  return `${data}.${sigB64u}`
}

export async function verifyQRToken(token: string, key: CryptoKey): Promise<QRPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, sig] = parts
    const data = `${header}.${body}`
    const enc = new TextEncoder()
    const sigBytes = Uint8Array.from(fromb64url(sig), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data))
    if (!valid) return null
    const payload = JSON.parse(fromb64url(body)) as QRPayload
    if (payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

export function isQRToken(value: string): boolean {
  const parts = value.split('.')
  if (parts.length !== 3) return false
  try {
    const header = JSON.parse(fromb64url(parts[0]))
    return header.typ === 'TQRV1'
  } catch {
    return false
  }
}
