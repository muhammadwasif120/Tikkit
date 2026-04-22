'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import FloatingChat from '@/components/command/FloatingChat'
import GuidedTour from '@/components/onboarding/GuidedTour'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function DashboardShell({
  profile,
  unreadSupportCount = 0,
  children,
}: {
  profile: Profile | null
  unreadSupportCount?: number
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--guest-bg)' }}>
      <Sidebar
        profile={profile}
        unreadSupportCount={unreadSupportCount}
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
      <FloatingChat />
      <GuidedTour />
    </div>
  )
}