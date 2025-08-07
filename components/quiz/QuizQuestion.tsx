"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { AlertCircle, Info, Lightbulb } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QuizQuestionProps {
  question: string
  hint?: string
  context?: string
  className?: string
  animate?: boolean
  questionNumber?: number
  showNumbering?: boolean
}

/**
 * Unified Quiz Question Component
 * 
 * Provides consistent question display across all quiz types with:
 * - Responsive typography that scales properly
 * - Optional numbering and hints
 * - Consistent animations
 * - Full-width layout with proper content constraints
 */
export function QuizQuestion({
  question,
  hint,
  context,
  className,
  animate = true,
  questionNumber,
  showNumbering = false,
}: QuizQuestionProps) {
  return (
    <motion.div
      className={cn("w-full space-y-4", className)}
      initial={animate ? { opacity: 0, y: -20 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      {/* Question Text */}
      <div className="text-center space-y-4">
        {showNumbering && questionNumber && (
          <div className="text-sm font-medium text-muted-foreground">
            Question {questionNumber}
          </div>
        )}
        
        <motion.h2
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-relaxed max-w-5xl mx-auto px-4 break-words"
          initial={animate ? { opacity: 0, scale: 0.95 } : false}
          animate={animate ? { opacity: 1, scale: 1 } : false}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {question}
        </motion.h2>

        {/* Visual separator */}
        <motion.div
          className="h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full mx-auto max-w-32"
          initial={animate ? { scaleX: 0 } : false}
          animate={animate ? { scaleX: 1 } : false}
          transition={{ delay: 0.4, duration: 0.6 }}
        />
      </div>

      {/* Context Information */}
      {context && (
        <motion.div
          initial={animate ? { opacity: 0, y: 10 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              {context}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Hint */}
      {hint && (
        <motion.div
          initial={animate ? { opacity: 0, y: 10 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <Alert className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <span className="font-medium">Hint:</span> {hint}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </motion.div>
  )
}

export default QuizQuestion
