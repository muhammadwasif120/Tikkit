'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CreditCard, CheckCircle, XCircle, Clock, Eye,
  X, Check,
} from 'lucide-react'
import { approvePaymentSubmission, rejectPaymentSubmission } from '@/app/actions/paymentAccountActions'
import clsx from 'clsx'

type Submission = {
  id: string
  registration_id: string
  screenshot_url: string
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  submitted_at: string
  reviewed_at: string | null
  registration: {
    id: string
    full_name: string
    email: string
    event_id: string
    payment_status: string
  }
  payment_account: {
    label: string
    account_type: string
  } | null
}

const statusConfig = {
  pending:  { label: 'Pending Review', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Clock },
  approved: { label: 'Approved',       color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: CheckCircle },
  rejected: { label: 'Rejected',       color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: XCircle },
}

export default function PaymentReviewPanel({ eventId }: { eventId: string }) {
  const supabase = createClient()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('payment_submissions')
        .select(`
          *,
          registration:public_registrations(id, full_name, email, event_id, payment_status),
          payment_account:payment_accounts(label, account_type)
        `)
        .eq('event_id', eventId)
        .order('submitted_at', { ascending: false })

      setSubmissions((data ?? []) as any)
      setLoading(false)
    }
    load()

    // Realtime updates
    const channel = supabase
      .channel(`payment-submissions-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_submissions', filter: `event_id=eq.${eventId}` }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, supabase])

  const getScreenshotUrl = async (path: string) => {
    const { data } = await supabase.storage.from('payment-screenshots').createSignedUrl(path, 60)
    return data?.signedUrl ?? null
  }

  const handleViewScreenshot = async (path: string) => {
    const url = await getScreenshotUrl(path)
    if (url) setLightboxUrl(url)
  }

  const handleApprove = async (sub: Submission) => {
    setActionLoading(sub.id)
    await approvePaymentSubmission(sub.id, sub.registration_id)
    setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'approved' } : s))
    setActionLoading(null)
  }

  const handleReject = async (sub: Submission) => {
    setActionLoading(sub.id)
    await rejectPaymentSubmission(sub.id, sub.registration_id, rejectNote)
    setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'rejected', notes: rejectNote } : s))
    setRejectingId(null)
    setRejectNote('')
    setActionLoading(null)
  }

  const pending  = submissions.filter(s => s.status === 'pending')
  const reviewed = submissions.filter(s => s.status !== 'pending')

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  )

  return (
    <>
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Payment screenshot" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Reject note modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-brand-charcoal border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Reject Payment</h3>
            <p className="text-sm text-gray-400">Optionally add a note to the guest explaining the rejection.</p>
            <textarea
              className="input resize-none min-h-20 text-sm"
              placeholder="e.g. Screenshot is unclear, please resubmit..."
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setRejectingId(null); setRejectNote('') }} className="btn-secondary">Cancel</button>
              <button
                disabled={!!actionLoading}
                onClick={() => {
                  const sub = submissions.find(s => s.id === rejectingId)
                  if (sub) handleReject(sub)
                }}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-all flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No payment submissions yet</p>
            <p className="text-xs text-gray-600 mt-1">They&apos;ll appear here once guests submit their screenshots</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pending Review</p>
                  <span className="w-5 h-5 rounded-full bg-yellow-500 text-black text-[9px] font-bold flex items-center justify-center">
                    {pending.length}
                  </span>
                </div>
                {pending.map(sub => (
                  <SubmissionCard
                    key={sub.id}
                    sub={sub}
                    onView={() => handleViewScreenshot(sub.screenshot_url)}
                    onApprove={() => handleApprove(sub)}
                    onReject={() => setRejectingId(sub.id)}
                    actionLoading={actionLoading === sub.id}
                  />
                ))}
              </div>
            )}

            {/* Reviewed */}
            {reviewed.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Reviewed</p>
                {reviewed.map(sub => (
                  <SubmissionCard
                    key={sub.id}
                    sub={sub}
                    onView={() => handleViewScreenshot(sub.screenshot_url)}
                    readonly
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function SubmissionCard({
  sub, onView, onApprove, onReject, actionLoading, readonly,
}: {
  sub: Submission
  onView: () => void
  onApprove?: () => void
  onReject?: () => void
  actionLoading?: boolean
  readonly?: boolean
}) {
  const cfg = statusConfig[sub.status]
  const Icon = cfg.icon

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{sub.registration.full_name}</p>
          <p className="text-xs text-gray-500">{sub.registration.email}</p>
          {sub.payment_account && (
            <p className="text-xs text-gray-600 mt-0.5">Paid to: {sub.payment_account.label}</p>
          )}
        </div>
        <span className={clsx('flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border shrink-0', cfg.bg, cfg.color, cfg.border)}>
          <Icon className="w-3 h-3" /> {cfg.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onView}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 bg-white/3 transition-colors">
          <Eye className="w-3.5 h-3.5" /> View Screenshot
        </button>
        {sub.notes && (
          <span className="text-xs text-gray-500 italic truncate">&quot;{sub.notes}&quot;</span>
        )}
        <span className="text-xs text-gray-600 ml-auto shrink-0">
          {new Date(sub.submitted_at).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
        </span>
      </div>

      {!readonly && sub.status === 'pending' && (
        <div className="flex gap-2 pt-1 border-t border-white/5">
          <button onClick={onReject} disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all">
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button onClick={onApprove} disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-all">
            {actionLoading ? <div className="w-4 h-4 border-2 border-green-400/40 border-t-green-400 rounded-full animate-spin" /> : <><Check className="w-4 h-4" /> Approve</>}
          </button>
        </div>
      )}
    </div>
  )
}