/* ─── DashboardLoader ────────────────────────────────────────────────
   Neon skeleton loader for organiser dashboard pages.
   Renders inside the existing DashboardShell (sidebar + topbar stay
   visible) so only the main content area shows the skeleton.
   Pass `variant` to choose the layout shape.
────────────────────────────────────────────────────────────────────── */

type Variant = 'home' | 'list' | 'detail' | 'analytics'

export default function DashboardLoader({ variant = 'list' }: { variant?: Variant }) {
  return (
    <div className="skeleton-screen" style={{ width: '100%' }}>
      {variant === 'home'     && <HomeShape />}
      {variant === 'list'     && <ListShape />}
      {variant === 'detail'   && <DetailShape />}
      {variant === 'analytics'&& <AnalyticsShape />}
    </div>
  )
}

/* ── Shared primitives ────────────────────────────────────────────── */
function Bar({ w = '100%', h = 14, r = 6, mb = 0 }: { w?: string | number; h?: number; r?: number; mb?: number }) {
  return (
    <div className="skeleton" style={{
      width: w, height: h, borderRadius: r,
      marginBottom: mb, flexShrink: 0,
    }} />
  )
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="skeleton-card" style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(30,94,255,0.08)',
      borderRadius: 14, padding: '16px 18px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function TableRow() {
  return (
    <div className="skeleton-card" style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Bar w="55%" h={13} r={5} />
        <Bar w="35%" h={10} r={4} />
      </div>
      <Bar w={60} h={24} r={20} />
    </div>
  )
}

/* ── Home / overview ─────────────────────────────────────────────── */
function HomeShape() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Bar w={180} h={28} r={7} />
        <Bar w={110} h={34} r={10} />
      </div>

      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Bar w={70} h={11} r={4} />
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
            </div>
            <Bar w="60%" h={28} r={6} mb={6} />
            <Bar w="45%" h={10} r={4} />
          </Card>
        ))}
      </div>

      {/* Two-column row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Bar w={100} h={13} r={5} mb={4} />
          {[80, 65, 90, 55, 70].map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bar w={8} h={8} r={4} />
              <Bar w={`${w}%`} h={10} r={4} />
            </div>
          ))}
        </Card>
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Bar w={120} h={13} r={5} mb={4} />
          {[1, 2, 3, 4].map(i => (
            <TableRow key={i} />
          ))}
        </Card>
      </div>
    </div>
  )
}

/* ── List / table (events, approvals, guests, vendors) ──────────── */
function ListShape() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Heading + action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Bar w={160} h={26} r={7} />
        <Bar w={120} h={34} r={10} />
      </div>

      {/* Filter/search bar */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div className="skeleton" style={{ flex: 1, height: 38, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 90, height: 38, borderRadius: 10 }} />
      </div>

      {/* Table rows */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'flex', gap: 14, padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {[120, 80, 70, 60].map((w, i) => (
            <Bar key={i} w={w} h={10} r={4} />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6].map(i => <TableRow key={i} />)}
      </Card>
    </div>
  )
}

/* ── Event detail ────────────────────────────────────────────────── */
function DetailShape() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Back + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <Bar w={220} h={26} r={7} />
      </div>

      {/* Hero banner */}
      <div className="skeleton skeleton-card" style={{ height: 200, borderRadius: 16 }} />

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <Bar w={60} h={10} r={4} mb={8} />
            <Bar w="70%" h={16} r={5} />
          </Card>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[80, 70, 90, 65].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 36, borderRadius: 0, marginRight: 2 }} />
        ))}
      </div>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        {[1, 2, 3, 4].map(i => <TableRow key={i} />)}
      </Card>
    </div>
  )
}

/* ── Analytics ───────────────────────────────────────────────────── */
function AnalyticsShape() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Bar w={160} h={26} r={7} />

      {/* Stat pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <Bar w="55%" h={10} r={4} mb={10} />
            <Bar w="70%" h={28} r={6} />
          </Card>
        ))}
      </div>

      {/* Big chart */}
      <Card style={{ height: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Bar w={100} h={13} r={5} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 6, paddingTop: 10 }}>
          {[60, 80, 50, 90, 70, 85, 55, 95, 65, 75, 88, 60].map((h, i) => (
            <div key={i} className="skeleton" style={{
              flex: 1, height: `${h}%`, borderRadius: '4px 4px 0 0',
            }} />
          ))}
        </div>
      </Card>

      {/* Two small charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[1, 2].map(i => (
          <Card key={i} style={{ height: 140, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bar w={80} h={12} r={4} />
            <div className="skeleton" style={{ flex: 1, borderRadius: 10 }} />
          </Card>
        ))}
      </div>
    </div>
  )
}
