import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { verifyCsrfOrigin } from '@/lib/csrf'

const resend = new Resend(process.env.RESEND_API_KEY)

type Recipient = {
  email: string
  full_name: string
}

export async function POST(req: NextRequest) {
  const csrf = verifyCsrfOrigin(req)
  if (csrf) return csrf
  try {
    // SECURITY PATCH: Strongly authorize the sender
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { recipients, subject, body, eventId } = await req.json()

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

    if (!recipients?.length) {
      return NextResponse.json({ error: 'No recipients provided' }, { status: 400 })
    }

    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    // Send emails individually so we can personalise with {name}
    const results = await Promise.allSettled(
      recipients.map((recipient: Recipient) => {
        const firstName = recipient.full_name.split(' ')[0]
        const personalised = body.replace(/\{name\}/g, firstName)

        return resend.emails.send({
          from: 'Tikkit <onboarding@resend.dev>',
          to: recipient.email,
          subject,
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

    return NextResponse.json({ succeeded, failed })
  } catch (error: unknown) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send emails' },
      { status: 500 }
    )
  }
}