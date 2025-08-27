import type React from "react"
import { Suspense } from "react"

import type { Metadata } from "next"
import { SuspenseGlobalFallback } from "../../../components/loaders"


export const metadata: Metadata = {
  title: "Quiz | CourseAI",
  description: "Interactive quizzes and learning experiences",
  robots: {
    index: false,
    follow: true,
  },
}


export default async function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Show loader while nested routes/components suspend */}
      <div className="relative z-10">
        <Suspense fallback={<SuspenseGlobalFallback text="Loading quiz…" />}>
          {children}
        </Suspense>
      </div>
    </div>
  )
}
