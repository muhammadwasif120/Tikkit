import * as SecureStore from 'expo-secure-store'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

// SecureStore has a 2048-byte limit per key.
// Supabase sessions easily exceed this, so we chunk large values across multiple keys.
const CHUNK_SIZE = 1800 // safe margin below the 2048-byte limit

const nativeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // Try reading as a single value first (handles small values + legacy data)
    const direct = await SecureStore.getItemAsync(key)
    if (direct !== null) return direct

    // Reassemble from chunks
    const countStr = await SecureStore.getItemAsync(`${key}__chunks`)
    if (!countStr) return null
    const count = parseInt(countStr, 10)
    const parts: string[] = []
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}__chunk_${i}`)
      if (chunk === null) return null // incomplete — treat as missing
      parts.push(chunk)
    }
    return parts.join('')
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      // Small enough — store directly and remove any stale chunks
      await SecureStore.setItemAsync(key, value)
      await nativeStorage._deleteChunks(key)
    } else {
      // Too large — split into chunks and remove any stale direct value
      await SecureStore.deleteItemAsync(key)
      const chunks: string[] = []
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE))
      }
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}__chunk_${i}`, chunks[i])
      }
      await SecureStore.setItemAsync(`${key}__chunks`, String(chunks.length))
    }
  },

  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key)
    await nativeStorage._deleteChunks(key)
  },

  _deleteChunks: async (key: string): Promise<void> => {
    const countStr = await SecureStore.getItemAsync(`${key}__chunks`)
    if (!countStr) return
    const count = parseInt(countStr, 10)
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}__chunk_${i}`)
    }
    await SecureStore.deleteItemAsync(`${key}__chunks`)
  },
}

// SecureStore is native-only — fall back to localStorage on web
const storage = Platform.OS === 'web'
  ? {
      getItem: (key: string) => {
        try { return Promise.resolve(localStorage.getItem(key)) } catch { return Promise.resolve(null) }
      },
      setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value) } catch {}
        return Promise.resolve()
      },
      removeItem: (key: string) => {
        try { localStorage.removeItem(key) } catch {}
        return Promise.resolve()
      },
    }
  : nativeStorage

export const supabase = createClient(
  'https://eyelcvclqzxhaaxyvgfu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZWxjdmNscXp4aGFheHl2Z2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTU5ODEsImV4cCI6MjA4NzIzMTk4MX0.d7D2xE3UvOhqmBesKOmEd8JGka9CermfvqZvFUbWA3I',
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
