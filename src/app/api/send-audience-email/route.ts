import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

type Recipient = {
  email: string
  full_name: string
}

export async function POST(req: Request) {
  try {
    const { recipients, subject, body, eventId } = await req.json()

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