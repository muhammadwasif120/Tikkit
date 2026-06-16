import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Zap, KanbanSquare, FileText, TrendingUp, ArrowRight } from 'lucide-react'

export default async function VendorLandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: vendor } = await (supabase as any)
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (vendor) redirect('/vendor/os')
    else redirect('/vendor/onboarding')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', color: '#FFFFFF', fontFamily: '"DM Sans", sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#00E5FF,#CC00FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={18} color="#050508" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>Vendor X</span>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF', fontWeight: 700 }}>OS</span>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 560, marginBottom: 48 }}>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-1.5px', lineHeight: 1.1, fontFamily: '"Clash Display", sans-serif' }}>
          Run your event business<br />
          <span style={{ background: 'linear-gradient(90deg,#00E5FF,#CC00FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>from one OS.</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.6, margin: '0 0 32px' }}>
          CRM pipeline, smart invoicing, and cross-hire ledger — built for Pakistan's event vendors. Free to start.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/register?role=vendor" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 14, background: '#00E5FF', color: '#050508', fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
            Get started free <ArrowRight size={16} />
          </Link>
          <Link href="/auth/login?next=/vendor/os" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>

      {/* Feature chips */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 680 }}>
        {[
          { icon: KanbanSquare, label: 'Deal pipeline',    desc: '8-stage CRM kanban'      },
          { icon: FileText,     label: 'Smart invoicing',  desc: 'PDF + auto-reminders'    },
          { icon: TrendingUp,   label: 'Margin tracker',   desc: 'Net margin per event'    },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,255,0.1)', flex: '1 1 180px', minWidth: 180 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color="#00E5FF" />
            </div>
            <div>
              <p style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700, margin: '0 0 1px' }}>{label}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 48 }}>
        Part of the Tikkit X platform · tikkitx.com
      </p>
    </div>
  )
}
