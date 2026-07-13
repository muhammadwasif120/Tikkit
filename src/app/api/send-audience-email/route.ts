import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { verifyCsrfOrigin } from '@/lib/csrf'
import { stripHtml } from '@/lib/sanitize'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const csrf = verifyCsrfOrigin(req)
  if (csrf) return csrf
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subject, body, eventId } = await req.json()

    if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

    // Verify the user owns this event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event || (event as any).organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Bulk email is a prime abuse vector — cap broadcasts per organizer+event.
    const { checkRateLimit } = await import('@/lib/rateLimit')
    if (!(await checkRateLimit(`audience-email:${user.id}:${eventId}`, 5, 3_600_000))) {
      return NextResponse.json({ error: 'Too many emails sent for this event. Please try again later.' }, { status: 429 })
    }

    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    if (subject.length > 200) {
      return NextResponse.json({ error: 'Subject must be 200 characters or fewer' }, { status: 400 })
    }
    if (body.length > 10_000) {
      return NextResponse.json({ error: 'Body must be 10,000 characters or fewer' }, { status: 400 })
    }

    // Fetch recipients from DB — never trust client-supplied email list
    const { data: registrations, error: regError } = await supabase
      .from('public_registrations')
      .select('email, full_name')
      .eq('event_id', eventId)
      .in('status', ['approved', 'registered', 'checked_in'])

    if (regError) return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 })
    if (!registrations?.length) return NextResponse.json({ error: 'No eligible recipients for this event' }, { status: 400 })

    // Strip HTML from organizer-supplied content before embedding in the email template
    const safeBody = stripHtml(body)
    const safeSubject = stripHtml(subject)

    const results = await Promise.allSettled(
      registrations.map(({ email, full_name }) => {
        const firstName = (full_name ?? '').split(' ')[0] || 'Guest'
        const personalised = safeBody.replace(/\{name\}/g, firstName)

        return resend.emails.send({
          from: 'Tikkit <onboarding@resend.dev>',
          to: email,
          subject: safeSubject,
          html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 560px; margin: 0 auto; background: #0F1117; color: #F3F4F6; padding: 40px 32px; border-radius: 16px;">
              <div style="margin-bottom: 32px;">
                <div style="display: inline-flex; align-items: center; gap: 8px; background: #1A1C23; padding: 8px 16px; border-radius: 8px; border: 1px solid #2D2F3A;">
                  <span style="font-size: 18px; font-weight: 700; color: white; letter-spacing: -0.5px;">Tikkit</span>
                </div>
              </div>
              <div style="white-space: pre-line; font-size: 15px; line-height: 1.7; color: #D1D5DB;">
                ${personalised.replace(/\n/g, '<br/>')}
              </div>
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #2D2F3A; font-size: 12px; color: #6B7280;">
                You're receiving this because you're a valued guest on Tikkit.
              </div>
            </div>
          `,
        })
      })
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ succeeded, failed, total: registrations.length })
  } catch (error: unknown) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send emails' },
      { status: 500 }
    )
  }
}
