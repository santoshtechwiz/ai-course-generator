"use client"

import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store"
import { submitAnswer } from "@/app/store/slices/textQuizSlice"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  LightbulbIcon,
  SendIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  AlertTriangle,
  AlertCircle,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import { formatQuizTime } from "@/lib/utils/quiz-utils"
import type { OpenEndedQuestion, QuizAnswer } from "@/types/quiz"
import { submitAnswerLocally } from "@/app/store/slices/textQuizSlice"

interface QuizQuestionProps {
  question: OpenEndedQuestion
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
  onQuestionComplete: () => void
}

export  function OpenEndedQuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  onQuestionComplete,
}: QuizQuestionProps) {
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.textQuiz)

  const [answer, setAnswer] = useState("")
  const [timer, setTimer] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const answerRef = useRef<HTMLTextAreaElement>(null)

  // Parse hints from question data
  const hints = useMemo(() => {
    if (!question?.openEndedQuestion?.hints) return []
    return Array.isArray(question.openEndedQuestion.hints)
      ? question.openEndedQuestion.hints
      : question.openEndedQuestion.hints.split("|")
  }, [question?.openEndedQuestion?.hints])

  // Reset state when question changes
  useEffect(() => {
    setAnswer("")
    setTimer(0)
    setIsSubmitting(false)

    if (answerRef.current) {
      answerRef.current.focus()
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

  const handleSubmitAnswer = useCallback(() => {
    if (!answer.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      console.log("Creating answer object for submission")

      // Create the answer object with all required fields
      const answerObject: QuizAnswer = {
        questionId: question.id.toString(),
        questionIndex: questionNumber - 1, // Assuming questionNumber is 1-based
        answer: answer.trim(),
        timeSpent: timer,
        submittedAt: new Date().toISOString(),
      }

      console.log("Dispatching answer to Redux:", answerObject)

      // Dispatch the answer to the Redux store
      dispatch(submitAnswerLocally(answerObject))

      // Call the callback provided by the parent
      onQuestionComplete()

      console.log("Answer submitted. Current state:", {
        quizState: quizState,
        answerCount: quizState.answers?.length,
        currentQuestion: quizState.currentQuestionIndex,
      })
    } catch (error) {
      console.error("Error submitting answer:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [answer, dispatch, isSubmitting, onQuestionComplete, question.id, timer, quizState, questionNumber])

  const getDifficultyColor = (difficulty = "medium") => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "hard":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <motion.div
      key={question.id} // Important: Add key to ensure proper animation when question changes
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      data-testid="openended-quiz-question"
    >
      {/* Debug indicator - remove in production */}
      {process.env.NODE_ENV !== "production" && (
        <div className="text-xs text-muted-foreground mb-2">
          Current quiz state: {quizState?.status || "initializing"}, Questions: {quizState?.questions?.length || 0},
          Answers: {quizState?.answers?.length || 0}
        </div>
      )}

      <Card className="w-full max-w-4xl mx-auto shadow-lg border-t-4 border-primary">
        <CardHeader className="space-y-4">
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
                className={cn("text-white", getDifficultyColor(question.openEndedQuestion?.difficulty))}
              >
                {question.openEndedQuestion?.difficulty || "Medium"}
              </Badge>
            </div>
          </div>
          <motion.h2
            className="text-2xl font-bold leading-tight text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            data-testid="question-text"
          >
            {question.question}
          </motion.h2>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            ref={answerRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[150px] resize-none transition-all duration-200 focus:min-h-[200px] focus:ring-2 focus:ring-primary"
            data-testid="answer-textarea"
          />
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting}
              className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground"
              data-testid="submit-button"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  {isLastQuestion ? "Finishing Quiz..." : "Submitting..."}
                </>
              ) : (
                <>
                  <SendIcon className="w-4 h-4 mr-2" />
                  {isLastQuestion ? "Finish Quiz" : "Submit Answer"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Custom comparison function for memoization
function arePropsEqual(prevProps: QuizQuestionProps, nextProps: QuizQuestionProps) {
  return (
    prevProps.question.id === nextProps.question.id &&
    prevProps.questionNumber === nextProps.questionNumber &&
    prevProps.totalQuestions === nextProps.totalQuestions &&
    prevProps.isLastQuestion === nextProps.isLastQuestion
  )
}

export default memo(OpenEndedQuizQuestion);