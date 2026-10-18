'use client'

import { Button } from '@/components/kit'

export default function PrintButton() {
  return <Button variant="secondary" onClick={() => window.print()}>Print or save as PDF</Button>
}
