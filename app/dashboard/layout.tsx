import type React from "react"
import { getAuthSession } from "@/lib/auth"
import type { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"
import { DashboardLayout } from "@/components/dashboard/layout"



export const dynamic = 'force-dynamic'

export const metadata: Metadata = generateSEOMetadata({
  title: "Dashboard | CourseAI",
  description: "Access your courses, quizzes, and learning materials in one place. Track your progress and continue your learning journey.",
  noIndex: true, // Dashboard content should not be indexed
})

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

/**
 * Dashboard Layout
 *
 * Simplified layout that wraps dashboard pages with:
 * - Conditional authentication check (allows public exploration)
 * - Client-side providers
 * - Dashboard-specific UI components
 * - Error boundaries
 * 
 * ✅ UPDATED: Removed layout-level auth blocking to allow public exploration
 * Auth is now enforced at the action level (form submission, save, etc.)
 */
export default async function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  // ✅ NO AUTH BLOCKING AT LAYOUT LEVEL
  // Middleware + action-level checks handle authentication
  // This allows users to explore dashboard pages freely

  return (
    // Debug components - only show in development
       <ClientLayoutWrapper withTheme={true} withSubscriptionSync={true}>
        <DashboardLayout userId={session?.user?.id}>
          {children}
        </DashboardLayout>
       
     
      </ClientLayoutWrapper>
  
  )
}
