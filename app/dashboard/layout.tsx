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
 * - Authentication check
 * - Client-side providers
 * - Dashboard-specific UI components
 * - Error boundaries
 */
export default async function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  // Development bypass - allow access in development mode
  // Production bypass - allow access in production mode for demo purposes
  const isDevelopment = process.env.NODE_ENV === "development"
  const isProduction = process.env.NODE_ENV === "production"
  const bypassAuth = isDevelopment || isProduction

  if (!session && !bypassAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">
              You need to sign in to access the dashboard. Click the button below to continue to the login page.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Sign In
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Go Home
            </a>
          </div>
          {bypassAuth && (
            <div className="mt-6 p-4 bg-muted rounded-lg text-left">
              <p className="text-sm font-medium mb-2">Authentication Bypassed</p>
              <p className="text-xs text-muted-foreground">
                Authentication is bypassed in {isProduction ? 'production' : 'development'} mode for testing purposes.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    // Debug components - only show in development
       <ClientLayoutWrapper withTheme={true} withSubscriptionSync={true}>
        <DashboardLayout userId={session?.user?.id}>
          {children}
        </DashboardLayout>
       
     
      </ClientLayoutWrapper>
  
  )
}
