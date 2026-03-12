/* ─── Skeleton loader for Event Detail page ──────────────────────── */
export default function SkeletonEventDetail() {
  return (
    <div className="skeleton-screen" style={{ background: '#080A10', minHeight: '100svh', maxWidth: 480, margin: '0 auto', paddingBottom: 160 }}>

      {/* Hero image */}
      <div className="skeleton" style={{ height: 280, borderRadius: 0 }} />

      <div style={{ padding: '20px 16px 0' }}>

        {/* Title + organiser */}
        <div className="skeleton-card" style={{ marginBottom: 20 }}>
          <div className="skeleton skeleton-title" style={{ width: '85%', height: 28, marginBottom: 8 }} />
          <div className="skeleton skeleton-title" style={{ width: '60%', height: 24, marginBottom: 10 }} />
          <div className="skeleton skeleton-text" style={{ width: 140 }} />
        </div>

        {/* Key info grid 2×2 */}
        <div className="skeleton-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(30,94,255,0.07)',
              borderRadius: 14, padding: '12px 13px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <div className="skeleton skeleton-circle" style={{ width: 14, height: 14 }} />
                <div className="skeleton skeleton-text" style={{ width: 40, height: 8 }} />
              </div>
              <div className="skeleton skeleton-text" style={{ width: '70%', height: 14, marginBottom: 5 }} />
              <div className="skeleton skeleton-text" style={{ width: '50%', height: 9 }} />
            </div>
          ))}
        </div>

        {/* Countdown bar */}
        <div className="skeleton-card" style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(30,94,255,0.07)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div className="skeleton skeleton-text" style={{ width: 90 }} />
          <div className="skeleton skeleton-text" style={{ width: 70, height: 18 }} />
        </div>

        {/* Description */}
        <div className="skeleton-card" style={{ marginBottom: 20 }}>
          <div className="skeleton skeleton-text" style={{ width: 60, marginBottom: 10 }} />
          <div className="skeleton skeleton-text" style={{ width: '100%', marginBottom: 6 }} />
          <div className="skeleton skeleton-text" style={{ width: '95%', marginBottom: 6 }} />
          <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 6 }} />
          <div className="skeleton skeleton-text" style={{ width: '70%' }} />
        </div>
      </div>

      {/* Fixed CTA */}
      <div style={{
        position: 'fixed', bottom: 76, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, padding: '12px 16px',
      }}>
        <div className="skeleton" style={{ height: 54, borderRadius: 16 }} />
      </div>
    </div>
  )
}
