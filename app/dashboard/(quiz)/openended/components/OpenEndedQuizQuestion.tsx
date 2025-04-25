"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { cn } from "@/lib/utils"
import { useQuiz } from "@/app/context/QuizContext"

interface QuizQuestionProps {
  question: {
    id: number
    question: string
    answer: string
    openEndedQuestion: {
      hints: string | string[]
      difficulty: string
      tags: string | string[]
      inputType: string
    }
  }
  onAnswer: (answer: string) => void
  questionNumber: number
  totalQuestions: number
}

export default function OpenEndedQuizQuestion({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
}: QuizQuestionProps) {
  const [answer, setAnswer] = useState("")
  const [showHints, setShowHints] = useState<boolean[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState(Date.now())
  const [showTooFastWarning, setShowTooFastWarning] = useState(false)
  const [showGarbageWarning, setShowGarbageWarning] = useState(false)

  const minimumTimeThreshold = 5 // seconds for open-ended questions (longer than fill-in-the-blanks)
  const minimumAnswerLength = 10 // characters

  const hints = Array.isArray(question.openEndedQuestion?.hints)
    ? question.openEndedQuestion.hints
    : question.openEndedQuestion?.hints?.split("|") || []

  useEffect(() => {
    setShowHints(Array(hints.length).fill(false))
    setHintLevel(0)
    setAnswer("") // Reset answer when question changes
    setElapsedTime(0)
    setStartTime(Date.now())
    setShowTooFastWarning(false)
    setShowGarbageWarning(false)
  }, [question.id, hints.length])

  useEffect(() => {
    const timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Improve the handleSubmit function to provide better feedback
  const handleSubmit = async () => {
    // Prevent empty submissions
    if (!answer.trim()) {
      setShowGarbageWarning(true)
      return
    }

    // Check if answer is too short
    if (answer.trim().length < minimumAnswerLength) {
      setShowGarbageWarning(true)
      return
    }

    // Check if answer was submitted too quickly
    const timeSpent = (Date.now() - startTime) / 1000
    if (timeSpent < minimumTimeThreshold) {
      setShowTooFastWarning(true)
      return
    }

    setIsSubmitting(true)
    try {
      // Calculate time spent on this question
      const timeSpent = (Date.now() - startTime) / 1000

      // Call the onAnswer prop with the user's answer
      onAnswer(answer)

      // Reset state for next question (if any)
      setAnswer("")
      setShowHints(Array(hints.length).fill(false))
      setHintLevel(0)
    } catch (error) {
      console.error("Error submitting answer:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a function to check if the answer is valid
  const isAnswerValid = () => {
    return answer.trim().length >= minimumAnswerLength && !isSubmitting
  }

  const handleProgressiveHint = () => {
    if (hintLevel < hints.length) {
      setShowHints((prev) => {
        const newHints = [...prev]
        newHints[hintLevel] = true
        return newHints
      })
      setHintLevel((prev) => prev + 1)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const { state } = useQuiz()
  const isCompleting = state.animationState === "completing"

  return (
    <motion.div
      key={question.id} // Important: Add key to ensure proper animation when question changes
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
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
                <span className="font-mono">{formatTime(elapsedTime)}</span>
              </div>
              <Badge
                variant="secondary"
                className={cn("text-white", getDifficultyColor(question.openEndedQuestion?.difficulty || "medium"))}
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
          >
            {question.question}
          </motion.h2>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Warning Alerts */}
          <AnimatePresence>
            {showTooFastWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant="warning"
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

            {showGarbageWarning && (
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
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value)
              setShowGarbageWarning(false)
            }}
            placeholder="Type your answer here..."
            className="min-h-[150px] resize-none transition-all duration-200 focus:min-h-[200px] focus:ring-2 focus:ring-primary"
          />
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleProgressiveHint}
              disabled={hintLevel >= hints.length}
              className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground"
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
          <motion.button
            onClick={handleSubmit}
            disabled={!isAnswerValid()}
            className="w-full sm:w-auto ml-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={
              isCompleting
                ? {
                    scale: [1, 1.1, 1],
                    transition: { duration: 0.5 },
                  }
                : {}
            }
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              <>
                <SendIcon className="w-4 h-4 mr-2" />
                Submit Answer
              </>
            )}
          </motion.button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
