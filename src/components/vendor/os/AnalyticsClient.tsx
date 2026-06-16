'use client'

const C = {
  surface: '#0D0D14', card: '#111118', border: 'rgba(0,229,255,0.12)',
  cyan: '#00E5FF', magenta: '#CC00FF', muted: 'rgba(255,255,255,0.4)', text: '#FFFFFF',
}

type MonthData  = { month: string; revenue: number; expenses: number }
type DealPL     = { event_name: string; client_name: string; quote_value: number; cross_hire_cost: number }
type InvStatus  = { status: string; count: number; total: number }

type Props = {
  months:      MonthData[]
  dealPL:      DealPL[]
  invStatuses: InvStatus[]
  collected:   number
  outstanding: number
  totalBills:  number
  paidBills:   number
}

const INV_STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', partially_paid: 'Part Paid', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled',
}
const INV_STATUS_COLOR: Record<string, string> = {
  draft: 'rgba(255,255,255,0.35)', sent: '#00E5FF', partially_paid: '#F6C90E',
  paid: '#48BB78', overdue: '#FC8181', cancelled: 'rgba(255,255,255,0.2)',
}

function fmt(n: number) { return 'PKR ' + n.toLocaleString('en-PK') }

function BarChart({ months }: { months: MonthData[] }) {
  const maxVal = Math.max(...months.flatMap(m => [m.revenue, m.expenses]), 1)
  const H = 140; const barW = 18; const gap = 8; const groupGap = 20
  const groupW = barW * 2 + gap + groupGap
  const svgW = months.length * groupW + 40

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={svgW} height={H + 36} style={{ display: 'block' }}>
        {months.map((m, i) => {
          const x = 20 + i * groupW
          const rh = Math.round((m.revenue  / maxVal) * H)
          const eh = Math.round((m.expenses / maxVal) * H)
          return (
            <g key={m.month}>
              {/* Revenue bar */}
              <rect x={x} y={H - rh} width={barW} height={rh} rx={4} fill={C.cyan} opacity={0.85} />
              {/* Expenses bar */}
              <rect x={x + barW + gap} y={H - eh} width={barW} height={eh} rx={4} fill={C.magenta} opacity={0.75} />
              {/* Month label */}
              <text x={x + barW + gap / 2} y={H + 18} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.4)">{m.month}</text>
            </g>
          )
        })}
        {/* Zero line */}
        <line x1={16} y1={H} x2={svgW - 4} y2={H} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: C.cyan }} /><span style={{ fontSize: 11, color: C.muted }}>Revenue</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: C.magenta }} /><span style={{ fontSize: 11, color: C.muted }}>Expenses</span></div>
      </div>
    </div>
  )
}

export default function AnalyticsClient({ months, dealPL, invStatuses, collected, outstanding, totalBills, paidBills }: Props) {
  const totalRevenue  = months.reduce((s, m) => s + m.revenue, 0)
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0)
  const netPL         = totalRevenue - totalExpenses

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: C.text, fontSize: 22, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.4px' }}>Analytics</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>6-month rolling revenue, expenses, and P&L.</p>
      </div>

      {/* Cash flow snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total Collected',  value: fmt(collected),   color: '#48BB78' },
          { label: 'Outstanding',      value: fmt(outstanding), color: '#F6C90E' },
          { label: 'Bills Paid',       value: fmt(paidBills),   color: '#FC8181' },
          { label: 'Net P&L (6M)',     value: fmt(netPL),       color: netPL >= 0 ? '#48BB78' : '#FC8181' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{label}</p>
            <p style={{ color, fontSize: 18, fontWeight: 900, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue vs Expenses chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
        <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: '0 0 14px' }}>Revenue vs Expenses</p>
        {months.length === 0
          ? <p style={{ color: C.muted, fontSize: 13 }}>No data yet.</p>
          : <BarChart months={months} />
        }
      </div>

      {/* Invoice status breakdown */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', marginBottom: 16 }}>
        <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: '0 0 14px' }}>Invoice Status</p>
        {invStatuses.length === 0
          ? <p style={{ color: C.muted, fontSize: 13 }}>No invoices yet.</p>
          : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {invStatuses.map(s => {
                const col = INV_STATUS_COLOR[s.status] ?? C.muted
                return (
                  <div key={s.status} style={{ padding: '10px 14px', borderRadius: 12, background: `${col}0f`, border: `1px solid ${col}28`, minWidth: 110 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>{INV_STATUS_LABEL[s.status] ?? s.status}</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: C.text, margin: '0 0 2px' }}>{s.count}</p>
                    <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>PKR {s.total.toLocaleString('en-PK')}</p>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {/* P&L per deal */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
          <p style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: 0 }}>P&L per Deal</p>
        </div>
        {dealPL.length === 0
          ? <p style={{ color: C.muted, fontSize: 13, padding: '20px' }}>No fulfilled deals yet.</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Event', 'Client', 'Revenue', 'Cross-Hire Cost', 'Net', 'Margin'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dealPL.map((d, i) => {
                  const net    = d.quote_value - d.cross_hire_cost
                  const margin = d.quote_value > 0 ? Math.round((net / d.quote_value) * 100) : 0
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                      <td style={{ padding: '10px 14px', color: C.text, fontWeight: 600 }}>{d.event_name}</td>
                      <td style={{ padding: '10px 14px', color: C.muted }}>{d.client_name}</td>
                      <td style={{ padding: '10px 14px', color: C.text }}>PKR {d.quote_value.toLocaleString('en-PK')}</td>
                      <td style={{ padding: '10px 14px', color: '#FC8181' }}>PKR {d.cross_hire_cost.toLocaleString('en-PK')}</td>
                      <td style={{ padding: '10px 14px', color: net >= 0 ? '#48BB78' : '#FC8181', fontWeight: 700 }}>PKR {net.toLocaleString('en-PK')}</td>
                      <td style={{ padding: '10px 14px', color: margin >= 50 ? '#48BB78' : margin >= 20 ? '#F6C90E' : '#FC8181', fontWeight: 700 }}>{margin}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  )
}
