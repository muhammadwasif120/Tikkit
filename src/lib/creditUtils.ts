// ─── Credit tier utility ──────────────────────────────────────────────────────
// Pure function — safe to import in both client and server components

export function getCreditTier(score: number) {
  if (score >= 1000) return { label: 'Elite',    color: '#FFC745', bg: 'rgba(255,199,69,0.15)',  border: 'rgba(255,199,69,0.3)'  }
  if (score >= 500)  return { label: 'VIP',      color: '#A855F7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)'  }
  if (score >= 200)  return { label: 'Regular',  color: '#1E5EFF', bg: 'rgba(30,94,255,0.15)',  border: 'rgba(30,94,255,0.3)'  }
  if (score >= 50)   return { label: 'Rising',   color: '#22C55E', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.3)'  }
  return               { label: 'Newcomer', color: '#6B7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)' }
}
