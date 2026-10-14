'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import GuidedTour from '@/components/onboarding/GuidedTour'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function DashboardShell({
  profile,
  children,
}: {
  profile: Profile | null
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    // No background here — the layered navy gradient on <body> shows through,
    // giving the glass panels something to blur against.
    <div className="flex h-screen overflow-hidden overflow-x-hidden">
      <Sidebar
        profile={profile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>
      <GuidedTour />
    </div>
  )
}