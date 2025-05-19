"use client"

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react"
import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { submitAnswerLocally } from "@/app/store/slices/textQuizSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, ChevronRightIcon, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import { formatQuizTime } from "@/lib/utils/quiz-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { BlanksQuizProps } from '../blanks-quiz-types'

function BlanksQuizComponent({
  question,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  onQuestionComplete,
  ...props
}: BlanksQuizProps) {
  const dispatch = useAppDispatch()
  const [userAnswer, setUserAnswer] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timer, setTimer] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef<number>(Date.now())

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  // Reset state when question changes
  useEffect(() => {
    setUserAnswer("")
    setTimer(0)
    setIsSubmitting(false)
    setShowHint(false)
    setHintsUsed(false)
    startTimeRef.current = Date.now()

    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [question.id])

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1)
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Extract the blank part from the question
  const formattedQuestion = useMemo(() => {
    return question.question.replace(/\[\[(.*?)\]\]/g, "________")
  }, [question.question])

  // Extract the correct answer from the question
  const correctAnswer = useMemo(() => {
    const match = question.question.match(/\[\[(.*?)\]\]/)
    return match ? match[1] : question.answer || ""
  }, [question.question, question.answer])

  // Get hint from question or generate a simple one
  const hint = useMemo(() => {
    if (question.hints && question.hints.length > 0) {
      return question.hints[0]
    }

    // Generate a simple hint based on the correct answer
    if (correctAnswer) {
      const firstLetter = correctAnswer.charAt(0)
      const lastLetter = correctAnswer.charAt(correctAnswer.length - 1)
      return `The answer starts with "${firstLetter}" and ends with "${lastLetter}". It has ${correctAnswer.length} characters.`
    }

    return "No hint available for this question."
  }, [question.hints, correctAnswer])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(e.target.value)
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting || !userAnswer.trim()) return

      setIsSubmitting(true)

      try {
        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000)
        const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()

        const answer = {
          questionId: question.id,
          question: question.question,
          answer: userAnswer.trim(),
          correctAnswer,
          isCorrect,
          timeSpent,
          hintsUsed,
          index: questionNumber - 1,
        }

        dispatch(submitAnswerLocally(answer))

        // Call onQuestionComplete to move to the next question
        onQuestionComplete?.()
      } catch (error) {
        console.error("Error submitting answer:", error)
        setIsSubmitting(false)
      }
    },
    [userAnswer, dispatch, question, correctAnswer, hintsUsed, questionNumber, onQuestionComplete]
  )

  // Handle hint display
  const handleShowHint = useCallback(() => {
    setShowHint(true)
    setHintsUsed(true)
  }, [])

  // Add keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Submit on Enter if the answer is valid
      if (e.key === "Enter" && userAnswer.trim() && !isSubmitting && !e.shiftKey) {
        handleSubmit(new Event("submit") as any)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSubmit, userAnswer, isSubmitting])

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      data-testid="blanks-quiz-component"
      variants={containerVariants}
      {...props}
    >
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-t-4 border-primary">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center gap-1 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="font-medium text-foreground">Question {questionNumber}</span>
                <ChevronRightIcon className="h-4 w-4" />
                <span>{totalQuestions}</span>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono">{formatQuizTime(timer)}</span>
              </div>
              <Badge
                variant="secondary"
                className="text-white bg-blue-500"
              >
                Fill in the Blank
              </Badge>
            </div>
          </div>
          <motion.h3
            className="text-lg font-medium mb-4"
            variants={itemVariants}
            data-testid="question-text"
          >
            {formattedQuestion}
          </motion.h3>
        </CardHeader>

        <CardContent>
          <motion.div variants={itemVariants}>
            <form
              onSubmit={handleSubmit}
              id="blanks-form"
              className="space-y-4"
              data-testid="blanks-form"
            >
              <div className="space-y-2">
                <label htmlFor="answer" className="text-sm font-medium">
                  Your answer:
                </label>
                <Input
                  id="answer"
                  ref={inputRef}
                  value={userAnswer}
                  onChange={handleInputChange}
                  placeholder="Type your answer here..."
                  className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary"
                  data-testid="answer-input"
                  disabled={isSubmitting}
                />
              </div>

              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-md"
                >
                  <div className="flex gap-2">
                    <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Hint</p>
                      <p className="text-sm text-amber-700">{hint}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </form>
          </motion.div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleShowHint}
                  disabled={showHint || isSubmitting}
                  data-testid="hint-button"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Need a hint?
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Using a hint may affect your score</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            type="submit"
            form="blanks-form"
            disabled={!userAnswer.trim() || isSubmitting}
            data-testid="submit-button"
            className="transition-all duration-300"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLastQuestion ? "Finishing Quiz..." : "Submitting..."}
              </>
            ) : isLastQuestion ? (
              "Finish Quiz"
            ) : (
              "Next Question"
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Custom comparison function for memoization
function arePropsEqual(prevProps: BlanksQuizProps, nextProps: BlanksQuizProps) {
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.questionNumber === nextProps.questionNumber &&
    prevProps.isLastQuestion === nextProps.isLastQuestion
  )
}

// Export memoized component with custom comparison
export default memo(BlanksQuizComponent, arePropsEqual)
