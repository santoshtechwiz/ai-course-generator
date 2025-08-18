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
      difficulty={questionData.difficulty.toLowerCase() as "easy" | "medium" | "hard"}
      fullWidth={true}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full space-y-6"
      >
        {/* Header */}
        <motion.div className="text-center space-y-4">
          {/* Quiz Type Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Open-Ended Question</span>
            </div>
          </div>

          {/* Question Text */}
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed max-w-3xl mx-auto">
            {questionData.text}
          </h2>
        </motion.div>

        {/* Answer Input - Simplified */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-3xl mx-auto p-6 bg-card rounded-lg border border-border shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <label htmlFor="answer" className="text-sm font-medium text-foreground">
              Your Answer
            </label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  Provide a comprehensive answer with clear explanations
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Textarea
            id="answer"
            value={answer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Share your understanding and reasoning..."
            className={cn(
              "w-full min-h-[140px] resize-y transition-all duration-300 text-base p-4 rounded-xl",
              "border-2 focus:ring-0 focus:ring-offset-0 shadow-sm hover:shadow-md",
              "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
              isAnswered
                ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/30 dark:to-green-900/30 text-emerald-800 dark:text-emerald-200 shadow-emerald-200/50"
                : showValidation
                  ? "border-rose-400 bg-gradient-to-br from-rose-50 to-red-100/50 dark:from-rose-950/30 dark:to-red-900/20 shadow-rose-200/50"
                  : "border-violet-200 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-500 focus:border-violet-500 dark:focus:border-violet-400 focus:shadow-violet-200/50 dark:focus:shadow-violet-800/30",
            )}
            autoFocus
          />

          {/* Character count and validation */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span className="font-medium">{wordCount} words</span>
            <span className="font-medium">{answer.length} characters</span>
          </div>

          {/* Success indicator */}
          {answer.trim() && similarity >= 0.3 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300 bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-950/40 dark:to-green-900/30 p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg shadow-emerald-100/50 dark:shadow-emerald-900/20"
            >
              <div className="p-1 bg-emerald-500 rounded-full">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold">Excellent response! Your answer demonstrates good understanding.</span>
            </motion.div>
          )}

          {/* Validation Error */}
          {showValidation && answer.trim().length < minLength && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-3 text-rose-700 dark:text-rose-300 bg-gradient-to-r from-rose-50 to-red-100 dark:from-rose-950/40 dark:to-red-900/30 p-4 rounded-xl border-2 border-rose-200 dark:border-rose-800 shadow-lg shadow-rose-100/50 dark:shadow-rose-900/20"
              role="alert"
            >
              <div className="p-1 bg-rose-500 rounded-full">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold">Please provide at least {minLength} characters for a meaningful answer</span>
            </motion.div>
          )}

          {/* Keywords covered */}
          {keywordsCovered.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-indigo-50 to-purple-100 dark:from-indigo-950/30 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
              <span className="text-sm text-indigo-700 dark:text-indigo-300 font-semibold">Keywords covered:</span>
              {keywordsCovered.map((keyword, index) => (
                <Badge key={index} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg transition-shadow">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </motion.div>

        {/* Hint System - Enhanced with vibrant colors */}
        <motion.div 
          variants={itemVariants}
          className="space-y-4"
        >
          <HintSystem
            hints={hints || []}
            onHintUsed={(hintIndex) => handleHintUsed(hintIndex + 1)}
            questionText={questionData.text}
            maxHints={3}
            className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20 rounded-xl shadow-lg shadow-amber-100/50 dark:shadow-amber-900/20"
          />
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants}>
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
      </motion.div>
    </QuizContainer>
  )
}
