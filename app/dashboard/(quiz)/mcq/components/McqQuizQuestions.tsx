"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { HelpCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { cn, formatQuizTime } from "@/lib/utils"
import { useAnimation } from "@/providers/animation-provider"
import { MotionTransition } from "@/components/ui/animations/motion-wrapper"
import { QuizProgress } from "../../components/QuizProgress"
import type { Question } from "./types"

interface McqQuizQuestionsProps {
  currentQuestion: Question | null
  currentQuestionIndex: number
  selectedOptions: (string | null)[]
  timeSpent: number[]
  title: string
  totalQuestions: number
  isSubmitting: boolean
  handleSelectOption: (value: string) => void
  handleNextQuestion: () => void
}

/**
 * Component that renders the actual quiz questions and handles user interactions
 */
export function McqQuizQuestions({
  currentQuestion,
  currentQuestionIndex,
  selectedOptions,
  timeSpent,
  title,
  totalQuestions,
  isSubmitting,
  handleSelectOption,
  handleNextQuestion,
}: McqQuizQuestionsProps) {
  const { animationsEnabled } = useAnimation()

  // Generate and shuffle options for the current question
  const [uniqueOptions, hasError] = useMemo(() => {
    if (!currentQuestion) {
      return [[], true]
    }

    const allOptions = [
      currentQuestion.answer,
      currentQuestion.option1,
      currentQuestion.option2,
      currentQuestion.option3,
    ].filter(Boolean)

    const uniqueOptionsSet = new Set(allOptions)

    if (uniqueOptionsSet.size < 2) {
      return [[], true]
    }

    if (uniqueOptionsSet.size < 4) {
      const fallbackOptions = [
        "None of the above",
        "All of the above",
        "Not enough information",
        "Cannot be determined",
      ]

      let i = 0
      while (uniqueOptionsSet.size < 4 && i < fallbackOptions.length) {
        uniqueOptionsSet.add(fallbackOptions[i])
        i++
      }
    }

    const shuffledOptions = [...uniqueOptionsSet].sort(() => Math.random() - 0.5)
    return [shuffledOptions, false]
  }, [currentQuestion])

  // Handle error state when question has insufficient options
  if (hasError) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">This question needs review due to insufficient options.</p>
          <Button onClick={handleNextQuestion}>Skip to Next Question</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <QuizProgress
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          timeSpent={timeSpent}
          title={title}
          quizType="Multiple Choice"
          animate={animationsEnabled}
        />
      </CardHeader>
      <CardContent className="p-6">
        <MotionTransition key={currentQuestionIndex} motionKey={""}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold">{currentQuestion?.question}</h2>
              </div>
              <RadioGroup
                value={selectedOptions[currentQuestionIndex] || ""}
                onValueChange={handleSelectOption}
                className="space-y-3 w-full mt-4"
              >
                {uniqueOptions.map((option, index) => (
                  <motion.div
                    key={`${index}-${option}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <div
                      className={cn(
                        "flex items-center space-x-2 p-4 rounded-lg transition-all w-full",
                        "border-2",
                        selectedOptions[currentQuestionIndex] === option
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-muted",
                      )}
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-grow cursor-pointer font-medium text-sm sm:text-base"
                      >
                        {option}
                      </Label>
                    </div>
                  </motion.div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </MotionTransition>
      </CardContent>
      <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 md:flex-row flex-col-reverse">
        <p className="text-sm text-muted-foreground">
          Question time: {formatQuizTime(timeSpent[currentQuestionIndex] || 0)}
        </p>
        <Button
          onClick={handleNextQuestion}
          disabled={selectedOptions[currentQuestionIndex] === null || isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Submitting...</span>
            </div>
          ) : currentQuestionIndex === totalQuestions - 1 ? (
            "Finish Quiz"
          ) : (
            <>
              Next Question
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
