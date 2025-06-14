"use client"

import { ReactNode, useMemo } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { QuizHeader } from "./QuizHeader"
import { cn } from "@/lib/utils"

export interface QuizContainerProps {
  children: ReactNode
  title?: string
  questionNumber?: number
  totalQuestions?: number
  showProgress?: boolean
  progressPercentage?: number
  quizType?: string
  className?: string
  headerClassName?: string
  contentClassName?: string
  footerClassName?: string
  footer?: ReactNode
  header?: ReactNode
  isAnimated?: boolean
  animationKey?: string | number
}

export function QuizContainer({
  children,
  title,
  questionNumber,
  totalQuestions,
  showProgress = true,
  progressPercentage,
  quizType = "quiz",
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  footer,
  header,
  isAnimated = true,
  animationKey,
}: QuizContainerProps) {
  // Calculate progress if not explicitly provided
  const calculatedProgress = useMemo(() => {
    if (progressPercentage !== undefined) return progressPercentage
    if (questionNumber && totalQuestions) {
      return Math.round((questionNumber / totalQuestions) * 100)
    }
    return 0
  }, [progressPercentage, questionNumber, totalQuestions])

  return (
    <motion.div
      initial={isAnimated ? { opacity: 0, y: 20 } : false}
      animate={isAnimated ? { opacity: 1, y: 0 } : false}
      exit={isAnimated ? { opacity: 0, y: -20 } : false}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={cn("w-full max-w-4xl mx-auto", className)}
    >
      <Card className="overflow-hidden border-2 border-border/50 shadow-lg bg-gradient-to-br from-background via-background to-muted/10">
        {header || (
          <QuizHeader
            title={title}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            progress={calculatedProgress}
            showProgress={showProgress}
            quizType={quizType}
            className={headerClassName}
          />
        )}

        <motion.div
          key={animationKey}
          initial={isAnimated ? { opacity: 0, x: 20 } : false}
          animate={isAnimated ? { opacity: 1, x: 0 } : false}
          exit={isAnimated ? { opacity: 0, x: -20 } : false}
          transition={{ duration: 0.3 }}
          className={cn("p-8", contentClassName)}
        >
          {children}
        </motion.div>

        {footer && (
          <div className={cn("p-6 border-t border-border/40", footerClassName)}>
            {footer}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

