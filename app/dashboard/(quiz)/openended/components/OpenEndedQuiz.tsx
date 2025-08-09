"use client"
import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Target, BookOpen, Clock, Brain, Lightbulb, Eye, Zap, Info } from "lucide-react" // Added Info icon
import { cn } from "@/lib/utils"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { TagsDisplay } from "@/components/quiz/TagsDisplay"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { calculateAnswerSimilarity, getSimilarityLabel, getSimilarityFeedback } from "@/lib/utils/text-similarity"
import { generateOpenEndedHints, calculateHintPenalty } from "@/lib/utils/hint-system"
import type { OpenEndedQuestion } from "@/app/types/quiz-types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Assuming Tooltip components are available

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

// Animation variants (kept consistent for smooth transitions)
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
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 25,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: { duration: 0.2 },
  },
}

const feedbackVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 28,
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -10,
    transition: { duration: 0.2 },
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
    const minLength = 10
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

  // Get feedback based on similarity
  const feedback = useMemo(() => {
    if (!answer.trim()) return null
    const label = getSimilarityLabel(similarity)
    const message = getSimilarityFeedback(similarity)
    let color = "text-gray-600"
    let bgColor = "bg-gray-50 dark:bg-gray-950/20"
    let borderColor = "border-gray-200 dark:border-gray-800"
    let icon = Target
    let level = "Getting Started"
    let emoji = "🎯"

    if (similarity >= 0.8) {
      color = "text-emerald-600"
      bgColor = "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20"
      borderColor = "border-emerald-200 dark:border-emerald-800"
      icon = CheckCircle
      level = "Excellent Response"
      emoji = "🏆"
    } else if (similarity >= 0.6) {
      color = "text-blue-600"
      bgColor = "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20"
      borderColor = "border-blue-200 dark:border-blue-800"
      icon = Target
      level = "Good Progress"
      emoji = "👍"
    } else if (similarity >= 0.4) {
      color = "text-yellow-600"
      bgColor = "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
      borderColor = "border-yellow-200 dark:border-yellow-800"
      icon = AlertCircle
      level = "Needs Improvement"
      emoji = "⚡"
    } else {
      color = "text-red-600"
      bgColor = "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
      borderColor = "border-red-200 dark:border-red-800"
      icon = AlertCircle
      level = "Keep Trying"
      emoji = "🎯"
    }
    return { label, message, color, bgColor, borderColor, icon, level, emoji }
  }, [answer, similarity])

  const minLength = 5  // Reduced from 10 to 5 for better UX
  // Updated logic: Enable next button based on minimum length AND similarity score
  const canProceed = answer.trim().length >= minLength && similarity >= 0.3  // Reduced threshold from 0.4 to 0.3
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
      <div className="space-y-6 sm:space-y-8">
        {/* Info Card (Difficulty & Tips) */}


        {/* Enhanced Question Display */}
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-violet-500 bg-gradient-to-r from-background to-violet-50/30 shadow-lg dark:to-violet-950/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground">Question</h3>
                    {/* Removed "Critical Thinking" badge */}
                  </div>
                  <p className="text-base sm:text-lg leading-relaxed text-foreground break-words">
                    {questionData.text}
                  </p>
                  {/* Removed "Writing Tip" section */}
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
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
            {/* Removed word/char count to focus on content */}
          </div>
          <Textarea
            id="answer"
            value={answer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Share your understanding and reasoning..."
            className={cn(
              "min-h-[120px] resize-y transition-all w-full border-2 bg-background",
              isAnswered
                ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                : showValidation
                  ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                  : "hover:border-violet-400 focus:border-violet-500 focus:shadow-violet-200/30",
            )}
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
              <AlertCircle className="w-4 h-4 animate-bounce flex-shrink-0" />
              <span className="font-medium text-center">
                Please provide at least {minLength} characters for a meaningful answer
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Simple success indicator - no detailed feedback to prevent answer revelation */}
        {answer.trim() && similarity >= 0.3 && (
          <div className="flex items-center justify-center pt-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-full">
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
    </QuizContainer>
  )
}
