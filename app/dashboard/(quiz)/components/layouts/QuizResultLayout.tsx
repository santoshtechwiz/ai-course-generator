"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface QuizResultLayoutProps {
  children: React.ReactNode
  title?: string
  quizType?: "mcq" | "code" | "blanks" | "openended" | "flashcard" | "quiz" | "others"
  slug?: string
}

const label: Record<string, string> = {
  mcq: "Multiple Choice",
  code: "Code Quiz",
  blanks: "Fill Blanks",
  openended: "Open Ended",
  flashcard: "Flashcards",
  quiz: "Quiz",
  others: "Mixed Quiz",
}

export default function QuizResultLayout({ children, title = "Quiz Results", quizType = "quiz", slug }: QuizResultLayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold truncate">{title}</h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{label[quizType] || "Quiz"}</Badge>
              {slug && <span className="truncate">{slug}</span>}
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" aria-label="Back to quizzes">
            <a href="/dashboard/quizzes">Back</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-6 py-3">
        {children}
      </main>
    </div>
  )
}