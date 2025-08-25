import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import { DashboardShell } from "@/components/features/dashboard/DashboardShell"
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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()

  if (!session) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex flex-col font-body flex-1">
      <DashboardShell>
        <main className="flex-1 pt-16">{children}</main>
        <Toaster />
        <Chatbot userId={session?.user?.id} />
        {process.env.NODE_ENV !== "production" && <CourseAIState />}
      </DashboardShell>
    </div>
  )
}
