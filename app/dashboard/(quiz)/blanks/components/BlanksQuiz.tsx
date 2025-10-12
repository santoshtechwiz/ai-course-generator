"use client"
import type React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Lightbulb, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { useOptionalQuizState } from "@/components/quiz/QuizStateProvider"
import { calculateAnswerSimilarity } from "@/lib/utils/text-similarity"
import { generateBlanksHints } from "@/lib/utils/hint-system"
import { AdaptiveFeedbackWrapper, useAdaptiveFeedback } from "@/components/quiz/AdaptiveFeedbackWrapper"
import { useAuth } from "@/modules/auth"

interface BlanksQuizProps {
  question: any
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
  slug?: string
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
  slug,
}: BlanksQuizProps) {
  const [answer, setAnswer] = useState(existingAnswer)
  const [similarity, setSimilarity] = useState<number>(0)
  const [isAnswered, setIsAnswered] = useState(!!existingAnswer)
  const [showValidation, setShowValidation] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const pendingResetRef = useRef(false)

  // Adaptive feedback integration
  const { isAuthenticated } = useAuth()
  const adaptiveFeedback = useAdaptiveFeedback(
    slug || 'unknown-quiz',
    question.id,
    isAuthenticated
  )

  // Extract question data with proper fallbacks
  const questionData = useMemo(() => {
    const answer = question.answer || ""
    const questionText = question.question || ""
    
    // Normalize tags/keywords which may appear in `tags` or `keywords`
    const tags = Array.isArray(question.tags) && question.tags.length > 0 
      ? question.tags 
      : Array.isArray(question.keywords) && question.keywords.length > 0 
      ? question.keywords 
      : []
    
    // Extract keywords from the answer if not provided
    const keywords = Array.isArray(question.keywords) && question.keywords.length > 0
      ? question.keywords
      : tags.length > 0
      ? tags
      : answer.length > 0
      ? [answer] // Use the answer itself as a keyword
      : []
    
    // Extract blanks metadata from question text (look for blank patterns)
    const blanks: string[] = []
    
    // If question has a blank (______), extract context around it
    if (questionText.includes("______")) {
      const parts = questionText.split("______")
      if (parts.length === 2) {
        // Extract meaningful words before and after the blank
        const before = parts[0].trim().split(/\s+/).slice(-3).join(" ")
        const after = parts[1].trim().split(/\s+/).slice(0, 3).join(" ")
        if (before || after) {
          blanks.push(`${before} _____ ${after}`.trim())
        }
      }
    }
    
    // Add answer pattern info (length, first/last letter)
    if (answer.length > 0) {
      blanks.push(`${answer.length} letters — starts with '${answer[0].toUpperCase()}' and ends with '${answer[answer.length - 1]}'`)
    }
    
    return {
      text: questionText,
      answer: answer,
      // Allow hints to be strings or objects; leave as-is for generator's normalization
      hints: question.hints,
      difficulty: question.difficulty || "Medium",
      tags: tags,
      keywords: keywords,
      blanks: blanks,
    }
  }, [question])

  // Mounted instrumentation removed

  // Generate comprehensive hints for this question
  const hints = useMemo(() => {
    return generateBlanksHints(
      questionData.answer,
      questionData.text,
      questionData.hints,
      answer,
    { allowDirectAnswer: false, maxHints: 3, keywords: questionData.tags || [], tags: questionData.tags || [] }
    )
  }, [questionData.answer, questionData.text, questionData.hints, answer])

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

  // Calculate similarity when answer changes. Do NOT include isAnswered in deps
  // because setIsAnswered is derived from the result and including it causes
  // an update loop that clears the input on each keystroke.
  useEffect(() => {
    if (answer.trim() && questionData.answer) {
      const result = calculateAnswerSimilarity(answer, questionData.answer, 0.7)
      setSimilarity(result.similarity)
      // derive isAnswered from the similarity check only
      const becameAnswered = result.isAcceptable
      setIsAnswered(becameAnswered)

      // Show celebration for first time the answer becomes acceptable
      if (becameAnswered && result.similarity >= 0.8) {
        setShowCelebration(true)
        const t = setTimeout(() => setShowCelebration(false), 2000)
        return () => clearTimeout(t)
      }
    } else {
      setSimilarity(0)
      setIsAnswered(false)
    }
    // intentionally omit isAnswered from deps
  }, [answer, questionData.answer])

  // Log whenever the local `answer` state changes (helps see writes from outside)
  useEffect(() => {
    // local answer changed; no debug logging
  }, [answer])

  // Sync answer state when question changes (only when moving to a different question)
  const questionIdRef = useRef(question?.id)
  useEffect(() => {
    if (questionIdRef.current !== question?.id) {
  // Always update the ref
  questionIdRef.current = question?.id

      // Only overwrite local answer if the input is not currently focused. If focused,
      // keep the user's in-progress typing and sync when the input blurs (handled below).
      if (!isFocused) {
        setAnswer(existingAnswer || '')
        setIsAnswered(!!existingAnswer)
        setShowValidation(false)
        setHintsUsed(0)
        setSimilarity(0)
      } else {
        // Reset derived states but preserve current typed answer
        setIsAnswered(!!existingAnswer)
        setShowValidation(false)
        setHintsUsed(0)
        setSimilarity(0)
      }
    }
  }, [question?.id, existingAnswer, isFocused])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAnswer(value)
    setShowValidation(false)
  }, [])

  // On blur: if there's a newer external existingAnswer (e.g., from another tab or sync), adopt it
  const handleInputBlur = useCallback(() => {
    setIsFocused(false)
    // If a reset was requested while the input was focused, perform it now
    if (pendingResetRef.current) {
      pendingResetRef.current = false
      setAnswer('')
      setIsAnswered(false)
      setShowValidation(false)
    }
  }, [answer, existingAnswer, question?.id])

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

      // Return cleanup to clear answer and hint counters
      return () => {
        setAnswer("")
        setSimilarity(0)
        setIsAnswered(false)
        setShowValidation(false)
        setHintsUsed(0)
        setIsFocused(false)
        setShowCelebration(false)
      }
    }
    return undefined
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
                  onBlur={handleInputBlur}
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
                  autoFocus={!isQuizCompleted}
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
                  onBlur={handleInputBlur}
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
                  autoFocus={!isQuizCompleted}
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

          {/* Adaptive Feedback Wrapper - Intelligent feedback based on attempts */}
          {answer.trim() && similarity < 0.6 && (
            <AdaptiveFeedbackWrapper
              quizSlug={slug || 'unknown-quiz'}
              questionId={question.id}
              userAnswer={answer}
              correctAnswer={questionData.answer}
              isAuthenticated={isAuthenticated}
              hints={hints.map((h) => h.content)}
              relatedTopicSlug={slug}
              difficulty={3}
              shouldShowFeedback={true}
              onReset={() => {
                // If user is currently typing, defer the reset until blur to avoid erasing in-progress input
                if (isFocused) {
                  pendingResetRef.current = true
                } else {
                  setAnswer('')
                  setIsAnswered(false)
                  setShowValidation(false)
                }
              }}
            />
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
            correctAnswer={questionData.answer}
            questionText={questionData.text}
            maxHints={3}
            tags={questionData.tags}
            keywords={questionData.keywords}
            blanks={questionData.blanks}
            className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/30 dark:to-yellow-900/20 rounded-xl shadow-lg shadow-amber-100/50 dark:shadow-amber-900/20"
          />
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants}>
          <QuizFooter
              onNext={(() => {
                const stateManager = useOptionalQuizState()
                if (stateManager) {
                  return () => stateManager.handleNext(handleNext)
                }
                return () => {
                  const result = handleNext()
                  if (typeof result === 'function') result()
                }
              })()}
            onPrevious={onPrevious}
            onSubmit={handleSubmit}
            canGoNext={canProceed && !isQuizCompleted}
            hasAnswer={canProceed}
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
