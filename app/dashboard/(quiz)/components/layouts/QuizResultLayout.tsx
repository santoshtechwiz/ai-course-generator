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
    case 'easy': return 'bg-green-600 text-white'
    case 'medium': return 'bg-yellow-600 text-white'
    case 'hard': return 'bg-red-600 text-white'
    default: return 'bg-primary text-primary-foreground'
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.header 
        className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
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
              <div className="p-3 rounded-2xl bg-main border-2 border-border shadow-shadow text-main-foreground">
                <QuizIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                  <Badge 
                    variant="neutral" 
                    className="bg-secondary-background text-foreground border-2 border-border shadow-shadow"
                  >
                    {quizTypeLabels[quizType] || "Quiz"}
                  </Badge>
                  {difficulty && (
                    <Badge 
                      className={cn(
                        "text-white border-2 border-border shadow-shadow font-bold",
                        getDifficultyColor(difficulty)
                      )}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Badge>
                  )}
                  {slug && (
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">
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
                className="flex items-center gap-2 hover:scale-105 transition-transform w-full sm:w-auto justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Quizzes
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Detailed Results - Direct display without duplicate hero banner */}
        <motion.div
          className="rounded-3xl border-2 border-border bg-card shadow-shadow p-4 sm:p-6 lg:p-8"
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