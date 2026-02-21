'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="card animate-slide-up text-center">
        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Check your email
        </h2>
        <p className="text-sm text-gray-400">
          We&apos;ve sent a confirmation link to <span className="text-white">{email}</span>. Click it to activate your account.
        </p>
        <Link href="/auth/login" className="btn-primary mt-6 justify-center">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="card animate-slide-up">
      <h1 className="text-xl font-semibold text-white mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Create your account
      </h1>
      <p className="text-sm text-gray-400 mb-6">Start managing events with Tikkit</p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input
            type="text"
            className="input"
            placeholder="Ahmed Raza"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Email address</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="divider" />

      <p className="text-sm text-center text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-brand-blue hover:text-brand-blue-light transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}