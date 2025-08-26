import type React from "react"
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper"
import { getAuthSession } from "@/lib/auth"
// Removed inline GlobalLoader to avoid duplicate overlays; relying on app-level GlobalLoader
import type { Metadata } from "next"
import MeteorShower from "@/components/ui/meteor-shower"

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
  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <MeteorShower>
        <div className="relative z-10">
          {children}
        </div>
      </MeteorShower>
    </div>
  )
}
