"use client"

import { ReactNode } from "react"
import { DashboardSidebar } from "@/app/dashboard/home/components/DashboardSidebar"
import { useAuth } from "@/hooks"
import { useUserData } from "@/hooks/useUserDashboard"
import type { DashboardUser } from "@/app/types/types"

interface DashboardLayoutWrapperProps {
  children: ReactNode
  userData?: DashboardUser | null
}

/**
 * Shared layout wrapper for all dashboard pages
 * Provides consistent sidebar across all dashboard routes
 */
export function DashboardLayoutWrapper({ children, userData }: DashboardLayoutWrapperProps) {
  const { user } = useAuth()
  const userId = typeof user?.id === 'string' ? user.id : String(user?.id || "")
  
  // Fetch user data if not provided
  const { data: fetchedUserData } = useUserData(userId)
  const finalUserData = userData || fetchedUserData || null

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar - Fixed */}
      <DashboardSidebar 
        userData={finalUserData}
        userStats={{
          coursesCount: finalUserData?.courses?.length || 0,
          quizzesCount: finalUserData?.userQuizzes?.length || 0,
          streakDays: 0,
          badgesEarned: 0,
        }}
      />

      {/* Main Content Area - Offset by sidebar width on desktop */}
      <div className="flex-1 lg:ml-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
