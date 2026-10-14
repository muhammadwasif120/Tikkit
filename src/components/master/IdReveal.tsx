'use client'

import { useState } from 'react'
import { Button } from '@/components/kit'
import { revealIdNumber } from '@/app/master/(protected)/verification/actions'

export default function IdReveal({ userId }: { userId: string }) {
  const [v, setV] = useState<string | null>(null)
  return v ? <span className="tnum font-mono text-sm text-fg">{v}</span> : <Button size="sm" variant="ghost" onClick={async () => { const r = await revealIdNumber(userId); setV('number' in r ? r.number! : (r.error ?? 'Error')) }}>Show number</Button>
}
