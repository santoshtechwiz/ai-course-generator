"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { cn } from "@/lib/utils"

interface McqQuizProps {
  question: {
    id: string
    text?: string
    question?: string
    options: string[]
  }
  onAnswer: (answer: string) => void
  onNext?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  canGoNext?: boolean
  isLastQuestion?: boolean
  showRetake?: boolean
}

const McqQuiz = ({
  question,
  onAnswer,
  onNext,
  onSubmit,
  onRetake,
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  canGoNext = false,
  isLastQuestion = false,
  showRetake = false,
}: McqQuizProps) => {
  // Calculate progress percentage
  const progressPercentage = Math.round((questionNumber / totalQuestions) * 100)

  // Ensure options are properly formatted dynamically
  const options = useMemo(() => {
    return (question?.options || []).map((option) => ({
      id: option,
      text: option,
    }))
  }, [question?.options])

  // Animation variants
  const optionsVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const optionVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  const questionText = question.text || question.question || "Question not available"

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      progressPercentage={progressPercentage}
      quizType="mcq"
      animationKey={question.id}
    >
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">{questionText}</h3>
        </div>

        <RadioGroup value={existingAnswer} onValueChange={onAnswer} className="space-y-4 pt-4">
          <motion.div variants={optionsVariants} initial="hidden" animate="show" className="space-y-3">
            {options.map((option) => (
              <motion.div
                key={option.id}
                variants={optionVariants}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div
                  className={cn(
                    "flex items-start space-x-3 rounded-lg border p-4 transition-all duration-200 cursor-pointer group",
                    "hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm",
                    existingAnswer === option.id && "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20",
                  )}
                  onClick={() => onAnswer(option.id)}
                >
                  <RadioGroupItem
                    value={option.id}
                    id={`option-${option.id}`}
                    disabled={isSubmitting}
                    className={cn(
                      "transition-colors duration-200",
                      existingAnswer === option.id ? "text-primary border-primary" : "group-hover:border-primary/50",
                    )}
                  />
                  <Label
                    htmlFor={`option-${option.id}`}
                    className={cn(
                      "flex-1 cursor-pointer text-base font-medium leading-relaxed transition-colors duration-200",
                      existingAnswer === option.id && "text-primary",
                      "group-hover:text-foreground",
                    )}
                  >
                    {option.text}
                  </Label>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </RadioGroup>
      </div>

      <QuizFooter
        onNext={onNext}
        onPrevious={undefined}
        onSubmit={onSubmit}
        onRetake={onRetake}
        canGoNext={!!existingAnswer && canGoNext}
        canGoPrevious={false}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        showRetake={showRetake}
        className="mt-6"
      />
    </QuizContainer>
  )
}

export default McqQuiz
