/* ─── Skeleton loader for the Explore page ────────────────────────── */
export default function SkeletonExplore() {
  return (
    <div style={{ padding: '12px 0' }}>

      {/* Search bar skeleton */}
      <div style={{ padding: '0 16px', marginBottom: 10 }}>
        <div className="skeleton" style={{ height: 44, borderRadius: 12 }} />
      </div>

      {/* Tag chips skeleton */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 14, overflow: 'hidden' }}>
        {[48, 56, 40, 64, 44].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 28, width: w, borderRadius: 8, flexShrink: 0 }} />
        ))}
      </div>

      {/* Hero banner skeleton */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div className="skeleton skeleton-rounded" style={{ height: 215, borderRadius: 20 }} />
      </div>

      {/* My Events strip label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px', marginBottom: 10 }}>
        <div className="skeleton" style={{ width: 3, height: 13, borderRadius: 2 }} />
        <div className="skeleton skeleton-text" style={{ width: 80 }} />
      </div>

      {/* My Events cards */}
      <div style={{ display: 'flex', gap: 9, padding: '0 16px', marginBottom: 24, overflow: 'hidden' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flexShrink: 0, width: 120 }}>
            <div className="skeleton" style={{ height: 64, borderRadius: 12, marginBottom: 4 }} />
            <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 3 }} />
            <div className="skeleton skeleton-text" style={{ width: '60%', height: 9 }} />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', marginBottom: 16 }}>
        <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.04)' }} />
        <div className="skeleton skeleton-text" style={{ width: 70, height: 9 }} />
        <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.04)' }} />
      </div>

      {/* Event rows */}
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ display: 'flex', gap: 11, padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Date col */}
          <div style={{ flexShrink: 0, width: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 2 }}>
            <div className="skeleton skeleton-text" style={{ width: 28, height: 9 }} />
            <div className="skeleton" style={{ width: 32, height: 22, borderRadius: 4 }} />
            <div className="skeleton skeleton-text" style={{ width: 24, height: 8 }} />
          </div>
          {/* Thumbnail */}
          <div className="skeleton" style={{ flexShrink: 0, width: 68, height: 68, borderRadius: 12 }} />
          {/* Info */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 2 }}>
            <div className="skeleton skeleton-title" style={{ width: '75%' }} />
            <div className="skeleton skeleton-text" style={{ width: '45%', height: 10 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <div className="skeleton skeleton-text" style={{ width: 55, height: 9 }} />
              <div className="skeleton skeleton-text" style={{ width: 70, height: 9 }} />
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <div className="skeleton" style={{ width: 48, height: 18, borderRadius: 5 }} />
              <div className="skeleton" style={{ width: 36, height: 18, borderRadius: 5 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
