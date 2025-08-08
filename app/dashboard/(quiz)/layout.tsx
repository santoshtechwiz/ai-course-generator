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
 * Quiz Layout - Bypasses DashboardShell
 * 
 * This layout provides essential providers (auth, theme, etc.) 
 * without the DashboardShell navigation/footer that would conflict 
 * with QuizPlayLayout's own UI structure.
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
      <GlobalLoader />
      {children}
      <Toaster />
    </ClientLayoutWrapper>
  )
}
