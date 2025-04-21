"use client"

import { Progress } from "@/components/ui/progress"
import { Timer } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

import { MotionWrapper } from "@/components/ui/animations/motion-wrapper"
import { formatQuizTime } from "@/lib/utils"

interface QuizProgressProps {
  currentQuestionIndex: number
  totalQuestions: number
  timeSpent: number[]
  title?: string
  quizType?: string
  animate?: boolean
}

export function QuizProgress({
  currentQuestionIndex,
  totalQuestions,
  timeSpent,
  title,
  quizType,
  animate = true,
}: QuizProgressProps) {
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100
  const totalTimeSpent = timeSpent.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      <MotionWrapper animate={animate} variant="slide" direction="down" duration={0.4}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            {quizType && (
              <Badge variant="outline" className="bg-primary/10 text-primary font-medium px-3 py-1">
                {quizType}
              </Badge>
            )}
            {title && <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-help">
                  <Timer className="w-4 h-4" />
                  {formatQuizTime(totalTimeSpent)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total time spent on the quiz</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </MotionWrapper>
      <MotionWrapper animate={animate} variant="slide" direction="up" duration={0.4} delay={0.1}>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress: {Math.round(progress)}%</span>
            <span>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>
      </MotionWrapper>
    </div>
  )
}
