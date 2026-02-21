'use client'

import { useEffect, useRef } from 'react'
import { X, Download } from 'lucide-react'
import QRCode from 'qrcode'
import type { Database } from '@/lib/supabase/database.types'

type Guest = Database['public']['Tables']['guests']['Row']

export default function QRModal({ guest, onClose }: { guest: Guest; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, guest.qr_code, {
        width: 240,
        margin: 2,
        color: {
          dark: '#1A1C23',
          light: '#FFFFFF',
        },
      })
    }
  }, [guest.qr_code])

  const downloadQR = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `tikkit-qr-${guest.full_name.replace(/\s+/g, '-')}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="card w-80 relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <p className="font-semibold text-white mb-0.5" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {guest.full_name}
          </p>
          <p className="text-xs text-gray-500 mb-4 capitalize">{guest.status.replace('_', ' ')}</p>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-xl">
              <canvas ref={canvasRef} />
            </div>
          </div>

          <p className="text-[11px] font-mono text-gray-500 mb-4">{guest.qr_code}</p>

          {guest.is_vip && (
            <div className="badge-yellow justify-center mb-3 mx-auto w-fit">⭐ VIP Guest</div>
          )}

          <button onClick={downloadQR} className="btn-secondary w-full justify-center text-xs">
            <Download className="w-3 h-3" />
            Download QR
          </button>
        </div>
      </div>
    </div>
  )
}