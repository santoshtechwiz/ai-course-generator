"use client"

import { Suspense } from "react"
import { MainNavbar } from "@/components/layout/navigation/MainNavbar"
import { CreditGuidanceBanner } from "@/components/shared/CreditGuidanceBanner"
import { ReduxErrorBoundary } from "@/components/ui/error-boundary"
import { GlobalLoader } from "@/components/ui/loader"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  userId?: string
  className?: string
}

/**
 * Dashboard Layout
 *
 * Layout specifically for dashboard pages.
 * Features:
 * - Main navigation bar (sticky)
 * - Credit guidance banner
 * - Error boundaries
 * - Dashboard-specific styling
 */
export function DashboardLayout({ children, userId, className }: DashboardLayoutProps) {
  return (
    <>
      {/* Main navigation bar */}
      <MainNavbar />

      {/* Dashboard content area with proper navbar offset */}
      <main className={cn(
        "min-h-screen pt-16 bg-[var(--color-bg)]",
        className
      )}>
        {/* Credit Guidance Banner - Shows for 0-credit users */}
        <CreditGuidanceBanner />

        <ReduxErrorBoundary>
          <Suspense fallback={<GlobalLoader message="Loading dashboard..." />}>
            {children}
          </Suspense>
        </ReduxErrorBoundary>
      </main>
    </>
  )
}