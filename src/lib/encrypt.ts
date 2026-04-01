/**
 * AES-256-GCM encryption for PII fields stored in the database.
 *
 * Requires CNIC_ENCRYPTION_KEY env var: a 32-byte hex string (64 hex chars).
 * Generate with: openssl rand -hex 32
 *
 * Ciphertext format (base64-encoded): <iv:12 bytes><authTag:16 bytes><ciphertext>
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12   // 96-bit IV recommended for GCM
const TAG_LENGTH = 16  // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.CNIC_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('CNIC_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decrypt(ciphertext: string): string {
  const key = getKey()
  const buf = Buffer.from(ciphertext, 'base64')
  const iv        = buf.subarray(0, IV_LENGTH)
  const tag       = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const encrypted = buf.subarray(IV_LENGTH + TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}

/**
 * Safe decrypt — returns null on failure rather than throwing.
 * Use when reading from DB where old unencrypted values may still exist.
 */
export function safeDecrypt(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return decrypt(value)
  } catch {
    // Legacy unencrypted value — return as-is
    return value
  }
}
