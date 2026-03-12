/* ─── Skeleton loader for My Tikkit (QR vault) page ─────────────── */
export default function SkeletonTikkit() {
  return (
    <div className="skeleton-screen" style={{ padding: '14px 16px 0' }}>

      {/* Header row: title + credit chip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="skeleton skeleton-title" style={{ width: 120 }} />
        <div className="skeleton" style={{ width: 80, height: 26, borderRadius: 20 }} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
        <div className="skeleton" style={{ flex: 1, height: 36, borderRadius: 0, borderBottom: '2px solid rgba(30,94,255,0.35)' }} />
        <div className="skeleton" style={{ flex: 1, height: 36, borderRadius: 0 }} />
      </div>

      {/* Registration cards — staggered */}
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-card" style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(30,94,255,0.08)',
          borderRadius: 20, overflow: 'hidden', marginBottom: 12,
        }}>
          {/* Cover */}
          <div className="skeleton" style={{ height: 100, borderRadius: 0 }} />
          {/* Info */}
          <div style={{ padding: '10px 14px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div className="skeleton skeleton-text" style={{ width: 140 }} />
                <div className="skeleton skeleton-text" style={{ width: 100 }} />
              </div>
              <div className="skeleton" style={{ width: 52, height: 28, borderRadius: 10 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
