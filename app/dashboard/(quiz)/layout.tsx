import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"
import { getAuthSession } from "@/lib/auth"
import { GlobalLoader } from "@/components/ui/loader"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Quiz | CourseAI",
  description: "Interactive quizzes and learning experiences",
  robots: {
    index: false,
    follow: true,
  },
}

/**
 * Enhanced Quiz Layout - Completely independent from DashboardShell
 *
 * This layout provides a dedicated quiz experience with:
 * - Independent navigation and UI structure
 * - Optimized for quiz interactions
 * - Enhanced responsive design
 * - Better accessibility features
 * - No interference with parent layouts
 */
export default async function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()

  return (
    <ClientLayoutWrapper
      session={session}
      withTheme={true}
      withSubscriptionSync={true}
    >
      <div className="min-h-screen bg-green-500 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        {/* Quiz-specific background pattern */}

        {/* Main quiz content area */}
        <div className="relative z-10 min-h-screen bg-red-500">
          <GlobalLoader />
          {children}
          <Toaster />
        </div>
      </div>
    </ClientLayoutWrapper>
  )
}
