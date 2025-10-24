"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Trophy, 
  BookOpen, 
  Brain, 
  Code,
  FileText,
  Award
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizResultLayoutProps {
  children: React.ReactNode
  title?: string
  quizType?: "mcq" | "code" | "blanks" | "openended" | "flashcard" | "ordering" | "quiz" | "others"
  slug?: string
  difficulty?: string
}

const quizTypeLabels: Record<string, string> = {
  mcq: "Multiple Choice",
  code: "Code Quiz", 
  blanks: "Fill Blanks",
  openended: "Open Ended",
  flashcard: "Flashcards",
  ordering: "Ordering Quiz",
  quiz: "Quiz",
  others: "Mixed Quiz",
}

const quizTypeIcons: Record<string, React.ComponentType<any>> = {
  mcq: Trophy,
  code: Code,
  blanks: FileText,
  openended: BookOpen,
  flashcard: Brain,
  ordering: Award,
  quiz: Award,
  others: Award,
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'bg-[var(--color-success)] text-white'
    case 'medium': return 'bg-[var(--color-warning)] text-white'
    case 'hard': return 'bg-[var(--color-error)] text-white'
    default: return 'bg-[var(--color-primary)] text-white'
  }
}

export default function QuizResultLayout({ 
  children, 
  title = "Quiz Results", 
  quizType = "quiz", 
  slug,
  difficulty = "medium"
}: QuizResultLayoutProps) {
  const QuizIcon = quizTypeIcons[quizType] || Award

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <motion.header 
        className="sticky top-0 z-50 bg-[var(--color-card)] border-b-4 border-[var(--color-border)] shadow-[var(--shadow-neo)]"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <motion.div 
              className="flex items-center gap-4 w-full sm:w-auto"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-3 rounded-[var(--radius)] bg-[var(--color-card)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)]">
                <QuizIcon className="w-6 h-6 text-[var(--color-text)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)]">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                  <Badge 
                    variant="neutral" 
                    className="bg-[var(--color-muted)] text-[var(--color-text)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] font-bold"
                  >
                    {quizTypeLabels[quizType] || "Quiz"}
                  </Badge>
                  {difficulty && (
                    <Badge 
                      className={cn(
                        "border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] font-black",
                        getDifficultyColor(difficulty)
                      )}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Badge>
                  )}
                  {slug && (
                    <span className="text-sm text-[var(--color-text)] opacity-75 truncate max-w-[200px] sm:max-w-none font-semibold">
                      {slug}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full sm:w-auto"
            >
              <Button 
                onClick={() => window.history.back()}
                variant="neutral"
                className="flex items-center gap-2 hover:scale-105 transition-transform w-full sm:w-auto justify-center bg-[var(--color-primary)] text-[var(--color-text)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none font-bold"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Quizzes
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Detailed Results - Direct display without duplicate hero banner */}
        <motion.div
          className="rounded-[var(--radius)] border-4 border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-neo)] p-3 sm:p-4 md:p-6 lg:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}