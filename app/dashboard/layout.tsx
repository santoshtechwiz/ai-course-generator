import type React from "react"
import { getAuthSession } from "@/lib/auth"
import type { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"
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
 * Simplified layout following Next.js best practices:
 * - DashboardLayout now includes all providers (Redux, Theme)
 * - Removed nested ClientLayoutWrapper for cleaner structure
 * - Conditional authentication check (allows public exploration)
 * - Dashboard-specific UI components and error boundaries
 * 
 * ✅ UPDATED: Consolidated providers into DashboardLayout component
 * Auth is enforced at the action level (form submission, save, etc.)
 */
export default async function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  return (
    <DashboardLayout userId={session?.user?.id}>
      {children}
    </DashboardLayout>
  )
}
