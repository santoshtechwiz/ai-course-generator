import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"
import CourseAIState from "@/components/development/CourseAIState"
import { getAuthSession } from "@/lib/auth"
import Chatbot from "@/components/features/chat/Chatbot"
import type { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"

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
 * Unified Dashboard Layout
 *
 * Follows Next.js App Router best practices:
 * - Single layout per route segment
 * - Proper composition with ClientLayoutWrapper
 * - Consistent structure across all dashboard pages
 * - Optimized for performance and maintainability
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <ClientLayoutWrapper withTheme={true} withSubscriptionSync={true}>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Main Content Area */}
        <main className="flex-1">{children}</main>

        {/* Global Components */}
        <Toaster />
        <Chatbot userId={session?.user?.id} />
        {process.env.NODE_ENV !== "production" && <CourseAIState />}
      </div>
    </ClientLayoutWrapper>
  )
}
