"use client"

import { useMemo } from "react"
import { CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FileQuestion, Code, AlignJustify, PenTool } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface QuizHeaderProps {
  title?: string
  questionNumber?: number
  totalQuestions?: number
  progress?: number
  showProgress?: boolean
  quizType?: string
  className?: string
}

export function QuizHeader({
  title,
  questionNumber,
  totalQuestions,
  progress = 0,
  showProgress = true,
  quizType = "quiz",
  className,
}: QuizHeaderProps) {
  const QuizIcon = useMemo(() => {
    switch (quizType.toLowerCase()) {
      case "mcq":
        return FileQuestion
      case "code":
        return Code
      case "openended":
        return AlignJustify
      case "blanks":
      case "fill-blanks":
        return PenTool
      default:
        return FileQuestion
    }
  }, [quizType])

  const headerTitle = title || 
    (questionNumber && totalQuestions 
      ? `Question ${questionNumber} of ${totalQuestions}` 
      : "Quiz")

  return (
    <CardHeader className={cn("bg-primary/5 border-b border-border/40 pb-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <QuizIcon className="w-5 h-5 text-primary" />
          </motion.div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {headerTitle}
            </h2>
            {quizType && (
              <Badge variant="outline" className="mt-1">
                {quizType.charAt(0).toUpperCase() + quizType.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        {questionNumber && totalQuestions && (
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {Math.round((questionNumber / totalQuestions) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        )}
      </div>

      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </CardHeader>
  )
}
