"use client"

import type React from "react"
import { useState, useEffect, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, ArrowRight, ArrowLeft, Flag } from "lucide-react"
import type { OpenEndedQuestion } from "@/types/quiz"

interface OpenEndedQuizProps {
  question: OpenEndedQuestion
  questionNumber: number
  totalQuestions: number
  existingAnswer?: string
  onAnswer: (answer: string) => boolean
  onNext?: () => void
  onPrevious?: () => void
  onSubmit?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
}

const OpenEndedQuiz = memo(function OpenEndedQuiz({
  question,
  questionNumber,
  totalQuestions,
  existingAnswer = "",
  onAnswer,
  onNext,
  onPrevious,
  onSubmit,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
}: OpenEndedQuizProps) {
  const [answer, setAnswer] = useState(existingAnswer || "")
  const [isFocused, setIsFocused] = useState(false)
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer)
  const [showValidation, setShowValidation] = useState(false)

  // Progress percentage
  const progressPercentage = (questionNumber / totalQuestions) * 100

  // When existingAnswer prop changes, update local state
  useEffect(() => {
    if (existingAnswer && existingAnswer !== answer) {
      setAnswer(existingAnswer)
      setIsAnswered(true)
    }
  }, [existingAnswer, answer])

  // Handle answer changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setAnswer(value)
      setShowValidation(false)

      // Auto-save answer as user types (debounced)
      if (value.trim()) {
        setIsAnswered(true)
        onAnswer(value)
      } else {
        setIsAnswered(false)
      }
    },
    [onAnswer],
  )

  // Handle next button click
  const handleNext = useCallback(() => {
    if (!answer.trim()) {
      setShowValidation(true)
      return
    }

    const success = onAnswer(answer)
    if (success && onNext) {
      onNext()
    }
  }, [answer, onAnswer, onNext])

  // Handle submit button click
  const handleSubmit = useCallback(() => {
    if (!answer.trim()) {
      setShowValidation(true)
      return
    }

    const success = onAnswer(answer)
    if (success && onSubmit) {
      onSubmit()
    }
  }, [answer, onAnswer, onSubmit])

  // Handle key press for form accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault()
        if (isLastQuestion) {
          handleSubmit()
        } else {
          handleNext()
        }
      }
    },
    [handleNext, handleSubmit, isLastQuestion],
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="overflow-hidden border-2 border-border/50 shadow-lg">
        {/* Header with progress */}
        <CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                {questionNumber}
              </span>
              <div>
                <Label className="text-lg font-semibold text-foreground">
                  Question {questionNumber} of {totalQuestions}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">Provide a detailed answer to the question</p>
              </div>
            </div>
            {isAnswered && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <CheckCircle className="h-6 w-6 text-success" />
              </motion.div>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6 leading-relaxed">{question.question || question.text}</h2>

            <div className="relative">
              <Textarea
                className={`min-h-[200px] resize-none text-lg border-2 transition-all duration-200 ${
                  isFocused
                    ? "border-primary shadow-md"
                    : isAnswered
                      ? "border-success/50 bg-success/5"
                      : showValidation
                        ? "border-destructive/50 bg-destructive/5"
                        : "border-muted-foreground/50"
                }`}
                placeholder="Type your detailed answer here..."
                value={answer}
                onChange={handleInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                aria-label="Open-ended answer"
                autoFocus
              />
              {showValidation && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive mt-2"
                >
                  Please enter an answer before continuing
                </motion.p>
              )}
            </div>

            {/* Keywords hint if available */}
            {question.keywords && question.keywords.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Keywords to consider:</p>
                <div className="flex flex-wrap gap-2">
                  {question.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-border/40">
            <div className="flex gap-3">
              {canGoPrevious && (
                <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              {!isLastQuestion ? (
                <Button
                  onClick={handleNext}
                  disabled={!answer.trim()}
                  className="flex items-center gap-2 min-w-[120px]"
                  size="lg"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  className="flex items-center gap-2 min-w-[140px] bg-success hover:bg-success/90"
                  size="lg"
                >
                  <Flag className="w-4 h-4" />
                  Finish Quiz
                </Button>
              )}
            </div>
          </div>

          {/* Answer status */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg"
              >
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Answer saved</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint about keyboard shortcut */}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Tip: Press Ctrl+Enter to quickly move to the next question
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
})

export default OpenEndedQuiz
