import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  role: string
  avatar_url: string | null
  username: string | null
}

type SignUpExtras = {
  role?: 'organizer' | 'guest'
  phone?: string
  city?: string
  company?: string
  gender?: string
}

type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, extras?: SignUpExtras) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  // Ref (not state) so we never re-render just because it flips
  const initializedRef = useRef(false)

  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, email, role, avatar_url, username')
        .eq('id', userId)
        .single()
      if (__DEV__) console.log('[Auth] fetchProfile →', { role: data?.role, error: error?.message })
      setProfile(data ? (data as Profile) : null)
    } catch (e) {
      if (__DEV__) console.error('[Auth] fetchProfile threw:', e)
      setProfile(null)
    }
  }

  useEffect(() => {
    // Safety net: if onAuthStateChange never fires (e.g. network issue at startup),
    // unblock the app after 10 s so the user at least sees the login screen.
    const timeout = setTimeout(() => {
      if (!initializedRef.current) {
        if (__DEV__) console.warn('[Auth] safety timeout — unblocking app')
        initializedRef.current = true
        setLoading(false)
      }
    }, 10_000)

    // IMPORTANT: never await a Supabase DB call inside onAuthStateChange.
    // The auth state machinery holds a lock while this callback runs — awaiting
    // a DB query (which needs that same lock to attach the JWT) causes a deadlock.
    // Instead we fire fetchProfile via setTimeout so it runs after the lock is released.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (__DEV__) console.log('[Auth] event:', event, '| user:', s?.user?.id ?? 'none')

      setSession(s)
      setUser(s?.user ?? null)

      if (s?.user) {
        const uid = s.user.id
        // Defer outside the auth lock — _layout keeps splash up while profile loads
        setTimeout(() => { fetchProfile(uid) }, 0)
      } else {
        setProfile(null)
      }

      // Only flip loading→false once (on the very first event, INITIAL_SESSION).
      // Subsequent events (SIGNED_IN, TOKEN_REFRESHED, etc.) must NOT reset loading.
      if (!initializedRef.current) {
        clearTimeout(timeout)
        initializedRef.current = true
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signUp = async (email: string, password: string, fullName: string, extras?: SignUpExtras) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: extras?.role ?? 'guest',
          phone: extras?.phone,
          city: extras?.city,
          company: extras?.company,
          gender: extras?.gender,
        },
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signIn, signUp, signOut,
      refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve(),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
