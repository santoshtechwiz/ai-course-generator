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
  quizType?: "mcq" | "code" | "blanks" | "openended" | "flashcard" | "quiz" | "others"
  slug?: string
  difficulty?: string
}

const quizTypeLabels: Record<string, string> = {
  mcq: "Multiple Choice",
  code: "Code Quiz", 
  blanks: "Fill Blanks",
  openended: "Open Ended",
  flashcard: "Flashcards",
  quiz: "Quiz",
  others: "Mixed Quiz",
}

const quizTypeIcons: Record<string, React.ComponentType<any>> = {
  mcq: Trophy,
  code: Code,
  blanks: FileText,
  openended: BookOpen,
  flashcard: Brain,
  quiz: Award,
  others: Award,
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'from-green-500 to-emerald-500'
    case 'medium': return 'from-yellow-500 to-orange-500'
    case 'hard': return 'from-red-500 to-pink-500'
    default: return 'from-[hsl(var(--primary))] to-[hsl(var(--accent))]'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.header 
        className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-[hsl(var(--primary-foreground))] shadow-lg">
                <QuizIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge 
                    variant="secondary" 
                    className="bg-gradient-to-r from-[hsl(var(--primary))]/10 to-[hsl(var(--accent))]/10 text-[hsl(var(--primary))] dark:from-[hsl(var(--primary))]/20 dark:to-[hsl(var(--accent))]/20 dark:text-[hsl(var(--primary))] border-[hsl(var(--primary))]/30 dark:border-[hsl(var(--primary))]/40"
                  >
                    {quizTypeLabels[quizType] || "Quiz"}
                  </Badge>
                  {difficulty && (
                    <Badge 
                      className={cn(
                        "text-white border-0",
                        `bg-gradient-to-r ${getDifficultyColor(difficulty)}`
                      )}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </Badge>
                  )}
                  {slug && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
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
            >
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Quizzes
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Detailed Results - Direct display without duplicate hero banner */}
        <motion.div
          className="rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl p-8"
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