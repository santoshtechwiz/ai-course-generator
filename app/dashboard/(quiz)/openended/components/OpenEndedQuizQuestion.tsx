"use client"

import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store"
import { submitAnswer } from "@/store/slices/textQuizSlice"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LightbulbIcon, SendIcon, CheckCircleIcon, ChevronRightIcon, AlertTriangle, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import { formatQuizTime } from "@/lib/utils/quiz-utils"
import type { OpenEndedQuestion, QuizAnswer } from "@/types/quiz"


interface QuizQuestionProps {
  question: OpenEndedQuestion
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
  onQuestionComplete: () => void
}

function OpenEndedQuizQuestionComponent({
  question,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  onQuestionComplete,
}: QuizQuestionProps) {
  const dispatch = useAppDispatch()
  const quizState = useAppSelector(state => state.textQuiz)
  
  const [answer, setAnswer] = useState("")
  const [showHints, setShowHints] = useState<boolean[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime] = useState(Date.now())
  const [showWarnings, setShowWarnings] = useState({
    tooFast: false,
    invalidAnswer: false
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Parse hints from question data
  const hints = useMemo(() => {
    if (!question?.openEndedQuestion?.hints) return []
    return Array.isArray(question.openEndedQuestion.hints)
      ? question.openEndedQuestion.hints
      : question.openEndedQuestion.hints.split("|")
  }, [question?.openEndedQuestion?.hints])

  // Reset state when question changes
  useEffect(() => {
    setShowHints(Array(hints.length).fill(false))
    setHintLevel(0)
    setAnswer("")
    setElapsedTime(0)
    setShowWarnings({ tooFast: false, invalidAnswer: false })
    setIsSubmitting(false)

    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [question.id, hints.length])

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!answer.trim() || isSubmitting) return

    // Validate answer length
    if (answer.trim().length < 10) {
      setShowWarnings(prev => ({ ...prev, invalidAnswer: true }))
      return
    }

    // Validate time spent
    if (elapsedTime < 5) {
      setShowWarnings(prev => ({ ...prev, tooFast: true }))
      return
    }

    setIsSubmitting(true)

    try {
      // First, dispatch the answer to the redux store
      const answerData: QuizAnswer = {
        questionId: question.id,
        question: question.question,
        answer: answer.trim(),
        timeSpent: elapsedTime,
        hintsUsed: hintLevel > 0,
      }
      
      dispatch(submitAnswer(answerData))

      // Then call the callback to move to next question
      await onQuestionComplete()
    } catch (error) {
      console.error("Error submitting answer:", error)
      setIsSubmitting(false)
    }
  }, [answer, isSubmitting, elapsedTime, question, hintLevel, onQuestionComplete, dispatch])

  const handleProgressiveHint = useCallback(() => {
    if (hintLevel < hints.length) {
      setShowHints(prev => {
        const newHints = [...prev]
        newHints[hintLevel] = true
        return newHints
      })
      setHintLevel(prev => prev + 1)
    }
  }, [hintLevel, hints.length])

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
      {process.env.NODE_ENV !== 'production' && (
        <div className="text-xs text-muted-foreground mb-2">
          Current quiz state: {quizState?.status || 'initializing'}, 
          Questions: {quizState?.questions?.length || 0}, 
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
                <span className="font-mono">{formatQuizTime(elapsedTime)}</span>
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
          {/* Warning Alerts */}
          <AnimatePresence>
            {showWarnings.tooFast && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant="danger"
                  className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30"
                >
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-800 dark:text-amber-400">You're answering too quickly</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    Please take your time to think about the answer before submitting. Open-ended questions require
                    thoughtful responses.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {showWarnings.invalidAnswer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/30"
                >
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle className="text-red-800 dark:text-red-400">Invalid answer</AlertTitle>
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    Your answer is either too short or doesn't seem related to the question. Please provide a thoughtful
                    response.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value)
              setShowWarnings({ tooFast: false, invalidAnswer: false })
            }}
            placeholder="Type your answer here..."
            className="min-h-[150px] resize-none transition-all duration-200 focus:min-h-[200px] focus:ring-2 focus:ring-primary"
            data-testid="answer-textarea"
          />
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleProgressiveHint}
              disabled={hintLevel >= hints.length}
              className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground"
              data-testid="hint-button"
            >
              <LightbulbIcon className="w-4 h-4 mr-2" />
              {hintLevel === 0 ? "Get Hint" : `Next Hint (${hintLevel}/${hints.length})`}
            </Button>
            <AnimatePresence>
              {showHints.map(
                (show, index) =>
                  show && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/10 p-2 rounded mt-2">
                        <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{hints[index]}</span>
                      </div>
                    </motion.div>
                  ),
              )}
            </AnimatePresence>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full sm:w-auto ml-auto transition-all duration-300 ${
              isSubmitting ? "bg-primary/80" : "bg-primary hover:bg-primary/90"
            } text-primary-foreground`}
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
        </CardFooter>
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

// Export memoized component with custom comparison
export default memo(OpenEndedQuizQuestionComponent, arePropsEqual)
