import type React from "react"
import type { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"
import { getServerAuthSession } from "@/lib/server-auth"
import { Chatbot } from "@/components/Chatbot"

export const metadata: Metadata = generateSEOMetadata({
  title: "Interactive Quizzes – Master Your Knowledge | CourseAI",
  description:
    "Explore our comprehensive collection of interactive quizzes including multiple choice, coding challenges, flashcards, and more. Test your knowledge and enhance your learning journey.",
  keywords: [
    "interactive quizzes",
    "knowledge testing",
    "learning assessment",
    "coding challenges",
    "educational quizzes",
    "skill evaluation",
    "practice tests",
    "learning platform",
    "quiz collection",
    "study tools",
    "flashcards",
    "multiple choice",
    "open ended questions",
    "quiz app",
    "online quiz platform",
    "quiz builder",
    "CourseAI quizzes",
  ],
  noIndex: true, // Dashboard content should not be indexed
})

/**
 * Simplified Quiz Layout
 * - Removes ModuleLayout wrapper for the quiz module
 * - Uses full-viewport flex container so children can occupy full width/height
 * - Keeps markup intentionally minimal to avoid layout constraints
 */
export default async function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerAuthSession()

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* main acts as the flexible container so children can grow/shrink */}
      <main className="flex-1 w-full min-h-0">
        {children}
      </main>
      {/* Include Chatbot for authenticated users */}
      {session?.user?.id && <Chatbot userId={session.user.id} />}
    </div>
  )
}
