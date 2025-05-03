"use client"
import { motion, AnimatePresence } from "framer-motion"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } 
from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  HelpCircle,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
  AlertCircle,
  Brain,
} from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import { formatQuizTime } from "@/lib/utils/quiz-performance"
import { useQuiz } from "@/app/context/QuizContext"
import { levenshteinDistance } from "@/lib/utils/quiz-options"
import { isGarbageInput, isTooFastAnswer } from "@/lib/utils/quiz-validation"
import { useState, useRef, useMemo, useEffect, useCallback } from "react"

interface Question {
  id: number
  question: string
  answer: string
  openEndedQuestion: {
    hints: string[]
    difficulty: string
    tags: string[]
    inputType: string
  }
}

interface FillInTheBlanksQuizProps {
  question: Question
  onAnswer: (answer: string, timeSpent: number, hintsUsed: boolean, similarity?: number) => void
  questionNumber: number
  totalQuestions: number
}

const Timer = ({ elapsedTime }: { elapsedTime: number }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono">{formatQuizTime(elapsedTime)}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Time spent on this question</p>
      </TooltipContent>
    </TooltipProvider>
  );
}

const BadgeGroup = ({ tags, difficulty }: { tags: string[]; difficulty: string }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30"
      case "hard":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30"
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className={`text-xs ${getDifficultyColor(difficulty)}`}>
        {difficulty}
      </Badge>
      {tags.map((tag, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  )
}

interface ProgressBarProps {
  progressPercentage: number
  questionNumber: number
  totalQuestions: number
}

const ProgressBar = ({ progressPercentage, questionNumber, totalQuestions }: ProgressBarProps) => (
  <div className="w-full space-y-1">
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>
        Question {questionNumber} of {totalQuestions}
      </span>
      <span>{Math.round(progressPercentage)}% Complete</span>
    </div>
    <Progress
      value={progressPercentage}
      className="h-1.5"
      aria-label={`Question ${questionNumber} of ${totalQuestions}, ${Math.round(progressPercentage)}% complete`}
    />
  </div>
)

export default function FillInTheBlanksQuiz({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
}: FillInTheBlanksQuizProps) {
  const [answer, setAnswer] = useState("")
  const [showHints, setShowHints] = useState<boolean[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isValidInput, setIsValidInput] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [hintLevel, setHintLevel] = useState(0)
  const [showHintPanel, setShowHintPanel] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [showTooFastWarning, setShowTooFastWarning] = useState(false)
  const [showGarbageWarning, setShowGarbageWarning] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { state } = useQuiz()
  const isCompleting = state.animationState === "completing"

  const similarityThreshold = 3
  const minimumPrefixLength = 2
  const progressPercentage = (questionNumber / totalQuestions) * 100
  const garbageThreshold = 0.75 // Adjust as needed
  const minimumTimeThreshold = 2 // seconds
  const questionParts = useMemo(() => {
    return question.question.split("_____")
  }, [question.question])

  const progressiveHints = useMemo(() => {
    if (!question.answer) return []

    const correctAnswer = question.answer.toLowerCase()
    const hintSteps = Math.ceil(correctAnswer.length / 3)
    const hints = []

    hints.push(`The answer has ${correctAnswer.length} characters.`)

    for (let i = 1; i <= hintSteps; i++) {
      const revealedLength = Math.floor((i / hintSteps) * correctAnswer.length)
      let hintText = ""
      for (let j = 0; j < correctAnswer.length; j++) {
        hintText += j < revealedLength ? correctAnswer[j] : correctAnswer[j] === " " ? " " : "•"
      }
      hints.push(hintText)
    }

    return [...hints, ...(question.openEndedQuestion?.hints || [])]
  }, [question.answer, question.openEndedQuestion?.hints])

  useEffect(() => {
    setAnswer("")
    setShowHints(Array(progressiveHints.length).fill(false))
    setSubmitted(false)
    setIsCorrect(false)
    setIsValidInput(false)
    setElapsedTime(0)
    setHintLevel(0)
    setShowHintPanel(false)
    setShowTooFastWarning(false)
    setShowGarbageWarning(false)
    setStartTime(Date.now())

    // Focus the input field when a new question is loaded
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 300)
  }, [question.id, progressiveHints.length])

  useEffect(() => {
    const timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleInputChange = useCallback(
    (value: string) => {
      setAnswer(value)
      setShowGarbageWarning(false)
      setShowTooFastWarning(false)

      const userInput = value.trim()?.toLowerCase()

      if (!userInput || userInput.length < minimumPrefixLength) {
        setIsValidInput(false)
        return
      }

      // Get all words from the question for context
      const contextWords = question.question
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 3)
      
      if (question.answer) {
        contextWords.push(question.answer.toLowerCase())
      }

      if (isGarbageInput(userInput, contextWords)) {
        setShowGarbageWarning(true)
        setIsValidInput(false)
        return
      }

      const correctAnswer = question.answer?.trim()?.toLowerCase() || ""
      const distance = levenshteinDistance(userInput, correctAnswer)

      // Consider an answer valid if it's close enough to the correct answer or starts with the correct prefix
      const isCloseEnough = distance <= similarityThreshold
      const hasCorrectPrefix = correctAnswer.startsWith(userInput) && userInput.length >= minimumPrefixLength

      setIsValidInput(isCloseEnough || hasCorrectPrefix)
    },
    [minimumPrefixLength, question.answer, question.question, similarityThreshold],
  )

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true)

    const timeSpent = (Date.now() - startTime) / 1000
    if (isTooFastAnswer(timeSpent, minimumTimeThreshold)) {
      setShowTooFastWarning(true)
      setIsSubmitting(false)
      return
    }

    // Get all words from the question for context
    const contextWords = question.question
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3)
    
    if (question.answer) {
      contextWords.push(question.answer.toLowerCase())
    }

    if (isGarbageInput(answer, contextWords)) {
      setShowGarbageWarning(true)
      setIsSubmitting(false)
      return
    }

    const userAnswer = answer.trim().toLowerCase()
    const correctAnswer = question.answer.trim().toLowerCase()
    const distance = levenshteinDistance(userAnswer, correctAnswer)
    const maxLength = Math.max(userAnswer.length, correctAnswer.length)
    const similarity = maxLength > 0 ? Math.max(0, 100 - (distance / maxLength) * 100) : 0

    const isAnswerCorrect = distance <= similarityThreshold
    setIsCorrect(isAnswerCorrect)
    setSubmitted(true)

    // Add a small delay to show the submission state
    setTimeout(() => {
      setIsSubmitting(false)
      onAnswer(answer, Math.round(timeSpent), hintLevel > 0, similarity)
    }, 500)
  }, [
    answer,
    hintLevel,
    minimumTimeThreshold,
    onAnswer,
    question.answer,
    question.question,
    similarityThreshold,
    startTime,
  ])

  const handleProgressiveHint = useCallback(() => {
    if (hintLevel < progressiveHints.length) {
      setShowHints((prev) => {
        const newHints = [...prev]
        newHints[hintLevel] = true
        return newHints
      })
      setHintLevel((prev) => prev + 1)
    }
  }, [hintLevel, progressiveHints.length])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && isValidInput && !submitted && !isSubmitting) {
        handleSubmit()
      }
    },
    [handleSubmit, isSubmitting, isValidInput, submitted],
  )

  return (
    <div className="w-full max-w-3xl mx-auto">
      <motion.div
        className="rounded-lg shadow-md border bg-background overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="px-6 py-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary font-medium px-3 py-1 flex items-center gap-1.5"
              >
                <Brain className="h-3.5 w-3.5" />
                Fill in the Blank
              </Badge>
              <BadgeGroup
                tags={question.openEndedQuestion?.tags || []}
                difficulty={question.openEndedQuestion?.difficulty || "medium"}
              />
            </div>
            <Timer elapsedTime={elapsedTime} />
          </div>

          <ProgressBar
            progressPercentage={progressPercentage}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
          />
        </div>

        <div className="px-6 py-4 space-y-6">
          <AnimatePresence>
            {showTooFastWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  variant="destructive"
                  className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30"
                >
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-800 dark:text-amber-400">You're answering too quickly</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    Please take your time to think about the answer before submitting.
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
                    Your answer doesn't seem related to the question. Please try again with a relevant answer.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="text-lg font-medium leading-relaxed p-4 bg-muted/30 rounded-lg flex flex-wrap items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span>{questionParts[0]}</span>
            <span
              className={cn(
                "inline-block min-w-[120px] border-b-2 border-dashed mx-1 text-center transition-all",
                inputFocused ? "border-primary" : "border-muted-foreground/50",
                submitted && (isCorrect ? "border-green-500" : "border-red-500"),
              )}
            >
              <Input
                ref={inputRef}
                value={answer}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                className={cn(
                  "border-none text-center focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-300 font-semibold",
                  submitted && (isCorrect ? "text-green-600" : "text-red-600"),
                )}
                placeholder="Type answer"
                disabled={submitted || isSubmitting}
                aria-label="Answer input field"
              />
            </span>
            <span>{questionParts[1]}</span>
          </motion.div>

          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-center p-4 rounded-md",
                  isCorrect
                    ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900/30"
                    : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-900/30",
                )}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                )}
                <span className={isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                  {isCorrect ? "Correct!" : "Incorrect. You'll see the correct answer after completing the quiz."}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <AnimatePresence>
              {showHintPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center text-blue-700 dark:text-blue-400 font-medium">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      <h3>Hints</h3>
                    </div>

                    <div className="space-y-2">
                      {showHints.map(
                        (show, hIndex) =>
                          show && (
                            <motion.div
                              key={hIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 * hIndex }}
                              className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400"
                            >
                              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <p>{progressiveHints[hIndex]}</p>
                            </motion.div>
                          ),
                      )}
                    </div>

                    {hintLevel < progressiveHints.length && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs w-full border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        onClick={handleProgressiveHint}
                        disabled={submitted || isSubmitting}
                      >
                        <Lightbulb className="w-3.5 h-3.5 mr-1" />
                        Reveal Next Hint
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-between items-center gap-4 flex-col-reverse sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="text-sm w-full sm:w-auto"
            onClick={() => setShowHintPanel(!showHintPanel)}
            disabled={submitted || isSubmitting}
          >
            {showHintPanel ? (
              <>
                <EyeOff className="w-4 h-4 mr-1.5" />
                Hide Hints
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1.5" />
                Show Hints
              </>
            )}
          </Button>

          <Button
            onClick={
              submitted
                ? () => onAnswer(answer, Math.round((Date.now() - startTime) / 1000), hintLevel > 0, similarity)
                : handleSubmit
            }
            disabled={(!isValidInput && !submitted) || isSubmitting}
            className="w-full sm:w-auto transition-colors duration-300 relative"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <span className="opacity-0">Submit Answer</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="h-5 w-5 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                </span>
              </>
            ) : submitted ? (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
