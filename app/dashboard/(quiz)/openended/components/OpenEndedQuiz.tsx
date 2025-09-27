"use client"
import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, BookOpen, Lightbulb, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { calculateAnswerSimilarity } from "@/lib/utils/text-similarity"
import { generateContentAwareHints } from "@/lib/utils/hint-system"
import type { OpenEndedQuestion } from "@/app/types/quiz-types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface OpenEndedQuizProps {
  question: OpenEndedQuestion
  questionNumber: number
  totalQuestions: number
  existingAnswer?: string
  onAnswer: (answer: string, similarity?: number, hintsUsed?: number) => boolean
  onNext?: () => void
  onPrevious?: () => void
  onSubmit?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  timeSpent?: number
}

// Standardized animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.6,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
      duration: 0.4,
      ease: "easeIn",
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
}

export default function OpenEndedQuiz({
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
  timeSpent = 0,
}: OpenEndedQuizProps) {
  const [answer, setAnswer] = useState(existingAnswer)
  const [similarity, setSimilarity] = useState<number>(0)
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer)
  const [showValidation, setShowValidation] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [keywordsCovered, setKeywordsCovered] = useState<string[]>([])

  // Extract question data with proper fallbacks
  const questionData = useMemo(() => {
    const openEndedData = question || {}
    return {
      text: question.question || question.text || "",
      answer: question.answer || openEndedData.correctAnswer || "",
      keywords: Array.isArray(question.tags) ? question.tags : [],
      hints: Array.isArray(question.hints) ? question.hints : [],
      difficulty: openEndedData.difficulty || question.difficulty || "Medium",
      tags: Array.isArray(openEndedData.tags) ? openEndedData.tags : Array.isArray(question.tags) ? question.tags : [],
    }
  }, [question])

  // Determine expected answer length based on question and answer characteristics
  const expectedLength = useMemo(() => {
    const questionText = questionData.text || ""
    const correctAnswer = questionData.answer || ""

    // Check question type indicators
    if (questionText.toLowerCase().includes("briefly") || questionText.toLowerCase().includes("short")) {
      return "short"
    }
    if (questionText.toLowerCase().includes("detail") || questionText.toLowerCase().includes("explain") || questionText.toLowerCase().includes("discuss")) {
      return "long"
    }

    // Check answer length as indicator
    const answerWords = correctAnswer.split(/\s+/).filter(word => word.length > 0)
    if (answerWords.length < 25) return "short"
    if (answerWords.length > 100) return "long"
    return "medium"
  }, [questionData.text, questionData.answer])

  // Generate hints for this question using content-aware generation
  const hints = useMemo(() => {
    const validKeywords = Array.isArray(questionData.keywords) ? questionData.keywords : []
    return generateContentAwareHints(questionData.text || "", validKeywords, expectedLength)
  }, [questionData.keywords, questionData.text, expectedLength])

  // Calculate similarity and keyword coverage when answer changes
  useEffect(() => {
    if (answer.trim()) {
      if (questionData.answer) {
        const result = calculateAnswerSimilarity(answer, questionData.answer, 0.6)
        setSimilarity(result.similarity)
        setIsAnswered(result.isAcceptable)
      }
      // Check keyword coverage
      if (questionData.keywords.length > 0) {
        const covered = questionData.keywords.filter((keyword) => answer.toLowerCase().includes(keyword.toLowerCase()))
        setKeywordsCovered(covered)
      }
    } else {
      setSimilarity(0)
      setIsAnswered(false)
      setKeywordsCovered([])
    }
  }, [answer, questionData.answer, questionData.keywords])

  // Update answer from props
  useEffect(() => {
    if (existingAnswer && existingAnswer !== answer) {
      setAnswer(existingAnswer)
    }
  }, [existingAnswer, answer])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setAnswer(value)
    setShowValidation(false)
  }, [])

  const handleAnswerSubmit = useCallback(() => {
    const minLength = 5
    if (!answer.trim() || answer.trim().length < minLength) {
      setShowValidation(true)
      return false
    }
    return onAnswer(answer, similarity, hintsUsed)
  }, [answer, similarity, hintsUsed, onAnswer])

  const handleNext = useCallback(() => {
    if (handleAnswerSubmit() && onNext) {
      onNext()
    }
  }, [handleAnswerSubmit, onNext])

  const handleSubmit = useCallback(() => {
    if (handleAnswerSubmit() && onSubmit) {
      onSubmit()
    }
  }, [handleAnswerSubmit, onSubmit])

  const handleHintUsed = useCallback((hintLevel: number) => {
    if (hintLevel > 0) {
      setHintsUsed((prev) => prev + 1)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault()
        if (isLastQuestion) {
          handleSubmit()
        } else {
          handleNext()
        }
      }
    },
    [isLastQuestion, handleSubmit, handleNext],
  )

  const minLength = 5
  const canProceed = answer.trim().length >= minLength && similarity >= 0.3
  const wordCount = answer
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return (
    <div className="w-full h-full flex flex-col">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full h-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 flex-1 overflow-y-auto"
      >
        <div className="w-full h-full space-y-6 sm:space-y-8 pb-24">
          {/* Question Display */}
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full"
          >
            <Card className="w-full h-full border-0 shadow-lg bg-white dark:bg-gray-900">
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 h-1"></div>
              <CardContent className="w-full h-full p-6 sm:p-8">
                <div className="w-full space-y-6">
                  {/* Header Section */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-foreground">Open-Ended Question</h3>
                      {hintsUsed > 0 && (
                        <Badge variant="outline" className="mt-1 text-xs text-amber-600 border-amber-300">
                          <Lightbulb className="w-3 h-3 mr-1" />
                          {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="w-full text-center">
                    <p className="text-lg leading-relaxed text-foreground break-words max-w-4xl mx-auto">
                      {questionData.text}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Answer Input */}
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full space-y-4"
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="answer" className="text-sm font-medium text-foreground flex items-center gap-1">
                Your Answer
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-sm p-2">
                      Provide a comprehensive answer with clear explanations and relevant examples.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
            </div>
            <Textarea
              id="answer"
              value={answer}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Share your understanding and reasoning..."
              className={cn(
                "w-full min-h-[120px] sm:min-h-[140px] resize-y transition-all border-2 bg-background text-base sm:text-lg",
                "focus:outline-none focus:ring-0 p-4 sm:p-6 rounded-lg", // Larger padding on mobile
                "min-h-[3rem]", // Ensure minimum touch target when focused
                isAnswered
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                  : showValidation
                    ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                    : "border-gray-300 hover:border-violet-400 focus:border-violet-500 focus:shadow-violet-200/30",
              )}
              inputMode="text" // Better mobile keyboard
              autoCapitalize="sentences"
              autoComplete="off"
              autoFocus
              aria-label="Enter your detailed answer"
            />
            {showValidation && answer.trim().length < minLength && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-sm text-red-600 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-center">
                  Please provide at least {minLength} characters for a meaningful answer
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Success indicator */}
          {answer.trim() && similarity >= 0.3 && (
            <div className="flex items-center justify-center pt-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Good response!</span>
              </div>
            </div>
          )}

          {/* Hint System */}
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <HintSystem
              hints={hints || []}
              onHintUsed={(hintIndex, hint) => handleHintUsed(hintIndex + 1)}
              questionText={questionData.text}
              userInput={answer}
              correctAnswer={questionData.answer}
              maxHints={3}
              expectedLength={expectedLength}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Footer - Sticky at bottom */}
      <motion.div
        variants={itemVariants}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full flex-shrink-0"
      >
        <QuizFooter
          onNext={handleNext}
          onPrevious={onPrevious}
          onSubmit={handleSubmit}
          canGoNext={canProceed}
          canGoPrevious={canGoPrevious}
          isLastQuestion={isLastQuestion}
          hasAnswer={canProceed}
        />
      </motion.div>
    </div>
  )
}
