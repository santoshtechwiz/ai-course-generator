"use client"
import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Lightbulb, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { calculateAnswerSimilarity } from "@/lib/utils/text-similarity"
import { generateBlanksHints } from "@/lib/utils/hint-system"
import type { BlankQuizQuestion } from "@/app/types/quiz-types"

interface BlanksQuizProps {
  question: BlankQuizQuestion
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
  isQuizCompleted?: boolean
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

const inputFocusVariants = {
  focused: {
    scale: 1.02,
    boxShadow: "0 0 0 4px hsl(var(--primary) / 0.15)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
  unfocused: {
    scale: 1,
    boxShadow: "0 0 0 0px hsl(var(--primary) / 0)",
    transition: { duration: 0.2, ease: "easeIn" },
  },
}

export default function BlanksQuiz({
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
  isQuizCompleted = false,
}: BlanksQuizProps) {
  const [answer, setAnswer] = useState(existingAnswer)
  const [similarity, setSimilarity] = useState<number>(0)
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer)
  const [showValidation, setShowValidation] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Extract question data with proper fallbacks
  const questionData = useMemo(() => {
    return {
      text: question.question,
      answer: question.answer,
      hints: question.hints,
      difficulty: question.difficulty || "Medium",
      tags: question.tags || [],
    }
  }, [question])

  // Generate comprehensive hints for this question
  const hints = useMemo(() => {
    return generateBlanksHints(questionData.answer, questionData.text, questionData.hints)
  }, [questionData.answer, questionData.text, questionData.hints])

  // Parse question parts for blank display
  const questionParts = useMemo(() => {
    const blankMarker = "________"
    const parts = questionData.text.split(blankMarker)
    return {
      before: parts[0] || "",
      after: parts[1] || "",
      hasBlank: questionData.text.includes(blankMarker),
    }
  }, [questionData.text])

  // Calculate similarity when answer changes
  useEffect(() => {
    if (answer.trim() && questionData.answer) {
      const result = calculateAnswerSimilarity(answer, questionData.answer, 0.7)
      setSimilarity(result.similarity)
      const wasAnswered = isAnswered
      setIsAnswered(result.isAcceptable)

      // Show celebration for first correct answer
      if (!wasAnswered && result.isAcceptable && result.similarity >= 0.8) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 2000)
      }
    } else {
      setSimilarity(0)
      setIsAnswered(false)
    }
  }, [answer, questionData.answer, isAnswered])

  // Update answer from props
  useEffect(() => {
    if (existingAnswer && existingAnswer !== answer) {
      setAnswer(existingAnswer)
    }
  }, [existingAnswer, answer])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAnswer(value)
    setShowValidation(false)
  }, [])

  const handleAnswerSubmit = useCallback(() => {
    // Prevent submission if the quiz is already completed
    if (isQuizCompleted) {
      return false
    }
    
    if (!answer.trim()) {
      setShowValidation(true)
      return false
    }
    return onAnswer(answer, similarity, hintsUsed)
  }, [answer, similarity, hintsUsed, onAnswer, isQuizCompleted])

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

  const handleHintUsed = useCallback((hintIndex: number) => {
    setHintsUsed((prev) => Math.max(prev, hintIndex + 1))
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
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

  const canProceed = Boolean(answer.trim() && similarity >= 0.6)

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      animationKey={String(question.id)}
      fullWidth={true}
    >
      {isQuizCompleted && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-center"
        >
          <p className="text-amber-800 dark:text-amber-300 font-medium">
            This quiz has already been completed. You can review your answers but cannot submit again.
          </p>
        </motion.div>
      )}
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
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Fill in the Blank</span>
            </div>
          </div>
        </motion.div>

        {/* Question Content - Simplified */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-3xl mx-auto p-6 bg-card rounded-lg border border-border shadow-sm"
        >
          {questionParts.hasBlank ? (
            <div className="space-y-6 text-center">
              {/* Question text with blank */}
              <div className="text-lg leading-relaxed">
                <span className="text-foreground">{questionParts.before}</span>
              </div>

              {/* Input Field */}
              <motion.div
                variants={inputFocusVariants}
                animate={isFocused ? "focused" : "unfocused"}
                className="relative max-w-sm mx-auto"
              >
                <Input
                  value={answer}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Your answer"
                  disabled={isQuizCompleted}
                  className={cn(
                    "text-center font-semibold border-2 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md",
                    "text-base sm:text-lg py-4 px-6 focus:ring-0 focus:ring-offset-0", // Larger on mobile
                    "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
                    "min-h-[3rem]", // Ensure minimum touch target
                    isAnswered
                      ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/30 dark:to-green-900/30 text-emerald-800 dark:text-emerald-200 shadow-emerald-200/50"
                      : showValidation
                        ? "border-rose-400 bg-gradient-to-br from-rose-50 to-red-100/50 dark:from-rose-950/30 dark:to-red-900/20 shadow-rose-200/50"
                        : "border-cyan-200 dark:border-cyan-700 hover:border-cyan-400 dark:hover:border-cyan-500 focus:border-cyan-500 dark:focus:border-cyan-400 focus:shadow-cyan-200/50 dark:focus:shadow-cyan-800/30",
                  )}
                  inputMode="text" // Better mobile keyboard
                  autoCapitalize="sentences"
                  autoComplete="off"
                  autoFocus
                />

                {isAnswered && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.div>

              {/* Continuation of question */}
              <div className="text-lg leading-relaxed">
                <span className="text-foreground">{questionParts.after}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <p className="text-lg leading-relaxed text-foreground">
                {questionData.text}
              </p>
              <motion.div
                variants={inputFocusVariants}
                animate={isFocused ? "focused" : "unfocused"}
                className="relative max-w-sm mx-auto"
              >
                <Input
                  value={answer}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Enter your answer"
                  disabled={isQuizCompleted}
                  className={cn(
                    "text-center font-medium border-2 rounded-lg transition-all duration-200",
                    "text-base py-3 px-4",
                    isAnswered
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                      : showValidation
                        ? "border-destructive bg-destructive/10"
                        : "border-primary/30 hover:border-primary/50 focus:border-primary",
                  )}
                  autoFocus
                />

                {isAnswered && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}

          {/* Success Indicator */}
          {answer.trim() && similarity >= 0.6 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center justify-center pt-4"
            >
              <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300 bg-gradient-to-r from-emerald-50 to-green-100 dark:from-emerald-950/40 dark:to-green-900/30 px-4 py-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg shadow-emerald-100/50 dark:shadow-emerald-900/20">
                <div className="p-1 bg-emerald-500 rounded-full">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold">Perfect! That's the correct answer!</span>
              </div>
            </motion.div>
          )}

          {/* Validation Error */}
          {showValidation && !answer.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center justify-center gap-3 text-rose-700 dark:text-rose-300 mt-4 p-4 bg-gradient-to-r from-rose-50 to-red-100 dark:from-rose-950/40 dark:to-red-900/30 rounded-xl border-2 border-rose-200 dark:border-rose-800 shadow-lg shadow-rose-100/50 dark:shadow-rose-900/20"
              role="alert"
            >
              <div className="p-1 bg-rose-500 rounded-full">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold">Please enter an answer before continuing</span>
            </motion.div>
          )}
        </motion.div>

        {/* Hint System - Enhanced with vibrant colors */}
        <motion.div 
          variants={itemVariants}
          className="space-y-4"
        >
          <HintSystem
            hints={hints}
            onHintUsed={handleHintUsed}
            userInput={answer}
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
            canGoNext={canProceed && !isQuizCompleted}
            canGoPrevious={canGoPrevious}
            isLastQuestion={isLastQuestion}
            nextLabel="Next Question"
            submitLabel="Finish Quiz"
            disabled={isQuizCompleted}
          />
        </motion.div>
      </motion.div>
    </QuizContainer>
  )
}
