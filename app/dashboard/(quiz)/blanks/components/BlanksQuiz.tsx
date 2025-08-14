"use client"
import type React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Lightbulb, FileText, Clock } from "lucide-react"
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
}

// Enhanced animation variants with improved timing
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.08,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier for smoother animation
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.03,
      staggerDirection: -1,
      duration: 0.3,
      ease: "easeInOut",
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
      stiffness: 260,
      damping: 20,
      mass: 0.9,
    },
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.98,
    transition: { duration: 0.25, ease: "easeIn" },
  },
}

const inputFocusVariants = {
  focused: {
    scale: 1.01,
    transition: { 
      duration: 0.2, 
      ease: "easeOut",
      type: "spring",
      stiffness: 300,
      damping: 25
    },
  },
  unfocused: {
    scale: 1,
    transition: { 
      duration: 0.2, 
      ease: "easeIn",
      type: "spring",
      stiffness: 300,
      damping: 25
    },
  },
}

const celebrationVariants = {
  hidden: { scale: 0, opacity: 0, rotate: -180 },
  visible: {
    scale: [0, 1.2, 1],
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.6,
      ease: "backOut",
      times: [0, 0.6, 1],
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeIn" },
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
}: BlanksQuizProps) {
  // State management
  const [answer, setAnswer] = useState(existingAnswer)
  const [similarity, setSimilarity] = useState<number>(0)
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer)
  const [showValidation, setShowValidation] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  
  // Refs for better UX
  const inputRef = useRef<HTMLInputElement>(null)
  const celebrationTimeoutRef = useRef<NodeJS.Timeout>()

  // Extract question data with proper fallbacks
  const questionData = useMemo(() => {
    return {
      text: question.question || "",
      answer: question.answer || "",
      hints: question.hints || [],
      difficulty: question.difficulty || "Medium",
      tags: question.tags || [],
    }
  }, [question])

  // Generate comprehensive hints for this question
  const hints = useMemo(() => {
    if (!questionData.answer || !questionData.text) return []
    return generateBlanksHints(questionData.answer, questionData.text, questionData.hints)
  }, [questionData.answer, questionData.text, questionData.hints])

  // Parse question parts for blank display with improved logic
  const questionParts = useMemo(() => {
    const blankMarker = "________"
    const text = questionData.text || ""
    
    if (!text.includes(blankMarker)) {
      return {
        before: text,
        after: "",
        hasBlank: false,
      }
    }

    const parts = text.split(blankMarker)
    return {
      before: parts[0]?.trim() || "",
      after: parts[1]?.trim() || "",
      hasBlank: true,
    }
  }, [questionData.text])

  // Enhanced similarity calculation with debouncing
  const calculateSimilarityDebounced = useCallback(
    debounce((inputValue: string, correctAnswer: string) => {
      if (!inputValue.trim() || !correctAnswer) {
        setSimilarity(0)
        setIsAnswered(false)
        return
      }

      const result = calculateAnswerSimilarity(inputValue, correctAnswer, 0.7)
      setSimilarity(result.similarity)
      
      const wasAnswered = isAnswered
      const isNowCorrect = result.isAcceptable
      setIsAnswered(isNowCorrect)

      // Show celebration for first correct answer with high similarity
      if (!wasAnswered && isNowCorrect && result.similarity >= 0.85) {
        setShowCelebration(true)
        
        // Clear existing timeout
        if (celebrationTimeoutRef.current) {
          clearTimeout(celebrationTimeoutRef.current)
        }
        
        // Set new timeout
        celebrationTimeoutRef.current = setTimeout(() => {
          setShowCelebration(false)
        }, 2500)
      }
    }, 300),
    [isAnswered]
  )

  // Calculate similarity when answer changes
  useEffect(() => {
    calculateSimilarityDebounced(answer, questionData.answer)
    
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
    }
  }, [answer, questionData.answer, calculateSimilarityDebounced])

  // Update answer from props with validation
  useEffect(() => {
    if (existingAnswer !== undefined && existingAnswer !== answer) {
      setAnswer(existingAnswer)
    }
  }, [existingAnswer])

  // Auto-focus input on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [question.id])

  // Improved input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAnswer(value)
    setShowValidation(false)
    
    // Reset celebration if user starts typing again
    if (showCelebration && value !== answer) {
      setShowCelebration(false)
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
    }
  }, [answer, showCelebration])

  // Enhanced answer submission with better error handling
  const handleAnswerSubmit = useCallback(async (): Promise<boolean> => {
    const trimmedAnswer = answer.trim()
    
    if (!trimmedAnswer) {
      setShowValidation(true)
      inputRef.current?.focus()
      
      // Auto-hide validation after 3 seconds
      setTimeout(() => setShowValidation(false), 3000)
      return false
    }

    setIsSubmitting(true)
    setAttemptCount(prev => prev + 1)
    
    try {
      const success = await onAnswer(trimmedAnswer, similarity, hintsUsed)
      return success
    } catch (error) {
      console.error('Error submitting answer:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [answer, similarity, hintsUsed, onAnswer])

  // Enhanced navigation handlers with loading states
  const handleNext = useCallback(async () => {
    if (isSubmitting) return
    
    const success = await handleAnswerSubmit()
    if (success && onNext) {
      onNext()
    }
  }, [handleAnswerSubmit, onNext, isSubmitting])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    
    const success = await handleAnswerSubmit()
    if (success && onSubmit) {
      onSubmit()
    }
  }, [handleAnswerSubmit, onSubmit, isSubmitting])

  const handleHintUsed = useCallback((hintIndex: number) => {
    setHintsUsed((prev) => Math.max(prev, hintIndex + 1))
  }, [])

  // Enhanced keyboard handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !isSubmitting) {
        e.preventDefault()
        if (isLastQuestion) {
          handleSubmit()
        } else {
          handleNext()
        }
      }
      
      // Add Escape key to clear validation
      if (e.key === "Escape") {
        setShowValidation(false)
      }
    },
    [isLastQuestion, handleSubmit, handleNext, isSubmitting]
  )

  // Enhanced validation logic
  const canProceed = useMemo(() => {
    return Boolean(
      answer.trim() && 
      similarity >= 0.6 && 
      !isSubmitting
    )
  }, [answer, similarity, isSubmitting])

  // Format time display
  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return '0.00s'
    if (seconds < 60) return `${seconds.toFixed(2)}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toFixed(2).padStart(5, '0')}`
  }

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="blanks"
      animationKey={`blanks-${question.id}-${questionNumber}`}
      difficulty={questionData.difficulty.toLowerCase() as "easy" | "medium" | "hard"}
      fullWidth={true}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full space-y-6 relative"
      >
        {/* Progress and Time Indicator */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between text-sm text-muted-foreground mb-4"
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {questionData.difficulty}
            </Badge>
            {questionData.tags.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {questionData.tags[0]}
              </Badge>
            )}
          </div>
          
          {timeSpent > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(timeSpent)}</span>
            </div>
          )}
        </motion.div>

        {/* Question Content - Enhanced Layout */}
        <motion.div variants={itemVariants}>
          <Card className="w-full max-w-4xl mx-auto border-2 border-border/50 shadow-lg">
            <CardContent className="p-8">
              {questionParts.hasBlank ? (
                <div className="space-y-8">
                  {/* Question text with blank - Improved Typography */}
                  {questionParts.before && (
                    <div className="text-xl leading-relaxed text-center">
                      <span className="text-foreground font-medium">
                        {questionParts.before}
                      </span>
                    </div>
                  )}

                  {/* Enhanced Input Field */}
                  <motion.div
                    variants={inputFocusVariants}
                    animate={isFocused ? "focused" : "unfocused"}
                    className="relative max-w-md mx-auto"
                  >
                    <Input
                      ref={inputRef}
                      value={answer}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Type your answer here..."
                      disabled={isSubmitting}
                      className={cn(
                        "text-center font-semibold border-2 rounded-2xl transition-all duration-300",
                        "text-lg py-4 px-6 focus:ring-0 focus:ring-offset-0",
                        "bg-gradient-to-br shadow-lg hover:shadow-xl",
                        "placeholder:text-muted-foreground/60",
                        isAnswered
                          ? "border-emerald-500 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/20 text-emerald-900 dark:text-emerald-100 shadow-emerald-200/60 dark:shadow-emerald-900/30"
                          : showValidation
                            ? "border-rose-500 bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 dark:from-rose-950/40 dark:via-red-950/30 dark:to-pink-950/20 shadow-rose-200/60 dark:shadow-rose-900/30 animate-pulse"
                            : "border-blue-300 dark:border-blue-600 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:via-indigo-950/15 dark:to-cyan-950/10 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 focus:shadow-blue-200/60 dark:focus:shadow-blue-800/40",
                        isSubmitting && "opacity-70 cursor-wait"
                      )}
                      autoComplete="off"
                      spellCheck="false"
                    />

                    {/* Success Indicator with Animation */}
                    <AnimatePresence>
                      {isAnswered && (
                        <motion.div
                          variants={celebrationVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 ring-2 ring-white dark:ring-gray-900"
                        >
                          <CheckCircle className="w-5 h-5 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Loading Indicator */}
                    {isSubmitting && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl"
                      >
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Continuation of question */}
                  {questionParts.after && (
                    <div className="text-xl leading-relaxed text-center">
                      <span className="text-foreground font-medium">
                        {questionParts.after}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 text-center">
                  <div className="prose prose-lg dark:prose-invert mx-auto">
                    <p className="text-xl leading-relaxed text-foreground font-medium">
                      {questionData.text}
                    </p>
                  </div>
                  
                  <motion.div
                    variants={inputFocusVariants}
                    animate={isFocused ? "focused" : "unfocused"}
                    className="relative max-w-md mx-auto"
                  >
                    <Input
                      ref={inputRef}
                      value={answer}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Enter your answer"
                      disabled={isSubmitting}
                      className={cn(
                        "text-center font-semibold border-2 rounded-2xl transition-all duration-300",
                        "text-lg py-4 px-6",
                        isAnswered
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                          : showValidation
                            ? "border-destructive bg-destructive/10 animate-pulse"
                            : "border-primary/30 hover:border-primary/50 focus:border-primary",
                      )}
                      autoComplete="off"
                      spellCheck="false"
                    />

                    <AnimatePresence>
                      {isAnswered && (
                        <motion.div
                          variants={celebrationVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                        >
                          <CheckCircle className="w-5 h-5 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Success/Error Messages */}
        <AnimatePresence>
          {answer.trim() && similarity >= 0.6 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ 
                duration: 0.4, 
                ease: "backOut",
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              className="flex justify-center"
            >
              <div className="flex items-center gap-4 text-emerald-700 dark:text-emerald-300 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/50 dark:via-green-950/40 dark:to-teal-950/30 px-6 py-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-700 shadow-xl shadow-emerald-100/60 dark:shadow-emerald-900/30">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-bold">Excellent work!</span>
                  <span className="text-sm opacity-90">
                    Accuracy: {Math.round(similarity * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {showValidation && !answer.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "backOut" }}
              className="flex justify-center"
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center gap-4 text-rose-700 dark:text-rose-300 bg-gradient-to-r from-rose-50 via-red-50 to-pink-50 dark:from-rose-950/50 dark:via-red-950/40 dark:to-pink-950/30 px-6 py-4 rounded-2xl border-2 border-rose-200 dark:border-rose-700 shadow-xl shadow-rose-100/60 dark:shadow-rose-900/30">
                <div className="p-2 bg-gradient-to-br from-rose-500 to-red-600 rounded-full shadow-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-base font-bold">Answer required</span>
                  <span className="text-sm opacity-90">Please enter your answer to continue</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Hint System - Properly Aligned */}
        <motion.div 
          variants={itemVariants}
          className="w-full max-w-4xl mx-auto"
        >
          <HintSystem
            hints={hints}
            onHintUsed={handleHintUsed}
            userInput={answer}
            questionText={questionData.text}
            maxHints={3}
            className="border-2 border-amber-200 dark:border-amber-700 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/20 rounded-2xl shadow-xl shadow-amber-100/60 dark:shadow-amber-900/30"
          />
        </motion.div>

        {/* Enhanced Footer with Better Spacing */}
        <motion.div variants={itemVariants} className="pt-6">
          <QuizFooter
            onNext={handleNext}
            onPrevious={onPrevious}
            onSubmit={handleSubmit}
            canGoNext={canProceed}
            canGoPrevious={canGoPrevious}
            isLastQuestion={isLastQuestion}
            nextLabel={isSubmitting ? "Processing..." : "Next Question"}
            submitLabel={isSubmitting ? "Submitting..." : "Finish Quiz"}
            disabled={isSubmitting}
          />
        </motion.div>

        {/* Celebration Effect */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.6, ease: "backOut" }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center z-50"
            >
              <div className="text-6xl">🎉</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </QuizContainer>
  )
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}