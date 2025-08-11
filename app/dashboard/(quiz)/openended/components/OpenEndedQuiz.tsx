"use client"
import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, BookOpen, Lightbulb, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { calculateAnswerSimilarity } from "@/lib/utils/text-similarity"
import { generateOpenEndedHints } from "@/lib/utils/hint-system"
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

  // Generate hints for this question using actual question hints
  const hints = useMemo(() => {
    const validKeywords = Array.isArray(questionData.keywords) ? questionData.keywords : []
    const validHints = Array.isArray(questionData.hints) ? questionData.hints : []
    return generateOpenEndedHints(validKeywords, questionData.text || "", validHints)
  }, [questionData.keywords, questionData.text, questionData.hints])

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
      setHintsUsed((prev) => Math.max(prev, hintLevel))
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
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="openended"
      animationKey={String(question.id)}
      quizTitle="Open-Ended Question"
      timeSpent={timeSpent}
      difficulty={questionData.difficulty.toLowerCase() as "easy" | "medium" | "hard"}
      fullWidth={true}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="w-full space-y-8">
          {/* Question Display */}
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full"
          >
            <Card className="w-full border-0 shadow-lg bg-card">
              <div className="bg-primary h-1"></div>
              <CardContent className="w-full p-6 sm:p-8">
                <div className="w-full space-y-6">
                  {/* Header Section */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-foreground">Open-Ended Question</h3>
                      {hintsUsed > 0 && (
                        <Badge variant="outline" className="mt-1 text-xs">
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
            className="w-full space-y-4 max-w-4xl mx-auto"
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
                "w-full min-h-[140px] resize-y transition-all border-2 bg-background text-base",
                "focus:outline-none focus:ring-0 p-4 rounded-lg",
                isAnswered
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                  : showValidation
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-primary/30 hover:border-primary/50 focus:border-primary",
              )}
              autoFocus
              aria-label="Enter your detailed answer"
            />
            {showValidation && answer.trim().length < minLength && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-lg border border-destructive/20"
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
            className="w-full max-w-4xl mx-auto"
          >
            <HintSystem
              hints={hints || []}
              onHintUsed={(hintIndex) => handleHintUsed(hintIndex + 1)}
              questionText={questionData.text}
              maxHints={3}
            />
          </motion.div>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-4xl mx-auto"
          >
            <QuizFooter
              onNext={handleNext}
              onPrevious={onPrevious}
              onSubmit={handleSubmit}
              canGoNext={canProceed}
              canGoPrevious={canGoPrevious}
              isLastQuestion={isLastQuestion}
              nextLabel="Next Question"
              submitLabel="Finish Quiz"
            />
          </motion.div>
        </div>
      </motion.div>
    </QuizContainer>
  )
}
