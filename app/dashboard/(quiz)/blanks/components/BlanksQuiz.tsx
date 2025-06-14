"use client"

import type React from "react"
import { useState, useEffect, useCallback, memo, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lightbulb } from "lucide-react"
import type { BlankQuestion } from "./types"
import { getBestSimilarityScore, isAnswerCloseEnough, getHint } from "@/lib/utils/text-similarity"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"

// Define props interface for better type safety
interface BlanksQuizProps {
  question: BlankQuestion
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  onAnswer: (answer: string) => void
  onNext?: () => void
  onPrevious?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  isSubmitting?: boolean
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  showRetake?: boolean
}

const BlanksQuiz = memo(function BlanksQuiz({
  question,
  questionNumber,
  totalQuestions,
  existingAnswer = "",
  onAnswer,
  onNext,
  onPrevious,
  onSubmit,
  onRetake,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  isSubmitting = false,
  showRetake = false,
}: BlanksQuizProps) {
  // Better typing for refs
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // State with proper typing
  const [answer, setAnswer] = useState<string>(existingAnswer || "")
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [isAnswered, setIsAnswered] = useState<boolean>(!!existingAnswer)
  const [showValidation, setShowValidation] = useState<boolean>(false)
  const [isSpamming, setIsSpamming] = useState<boolean>(false)
  const [showHint, setShowHint] = useState<boolean>(false)
  const [hintState, setHintState] = useState<{ level: number; views: number }>({ level: 0, views: 0 })
  const [similarityScore, setSimilarityScore] = useState<number>(0)

  // Constants in SCREAMING_SNAKE_CASE for clarity
  const SIMILARITY_THRESHOLD = 60
  const SPAM_THRESHOLD = 80
  const DEBOUNCE_MS = 300

  const { beforeBlank, afterBlank } = useMemo(() => {
    const [before, after] = (question.question || "").split("________")
    return {
      beforeBlank: before || "",
      afterBlank: after || "",
    }
  }, [question.question])

  const progressPercentage = useMemo(
    () => ((questionNumber ?? 0) / (totalQuestions ?? 1)) * 100,
    [questionNumber, totalQuestions],
  )

  useEffect(() => {
    setAnswer(existingAnswer || "")
    setIsAnswered(!!existingAnswer)
  }, [existingAnswer])

  // Improve error handling and user feedback
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setAnswer(value)
      setShowValidation(false)

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

      // For immediate feedback, show loading state
      if (value.trim() && !isAnswered) {
        // Optional: Add loading indicator here
      }

      debounceTimerRef.current = setTimeout(() => {
        try {
          if (!value.trim()) {
            setIsAnswered(false)
            setSimilarityScore(0)
            setIsSpamming(false)
            return
          }

          const questionScore = getBestSimilarityScore(value, question.question || "")
          const isSpam = questionScore > SPAM_THRESHOLD
          setIsSpamming(isSpam)

          const answerScore = getBestSimilarityScore(value, question.answer || "")
          setSimilarityScore(answerScore)

          if (!isSpam) {
            setIsAnswered(true)
          }
        } catch (err) {
          console.error("Error processing answer:", err)
          // Handle potential errors in similarity calculation
        }
      }, DEBOUNCE_MS)

      // Notify immediately for form tracking
      onAnswer(value)
    },
    [onAnswer, question.question, question.answer, isAnswered],
  )

  // Focus input field on mount for better UX
  useEffect(() => {
    if (inputRef.current && !existingAnswer) {
      inputRef.current.focus()
    }
  }, [existingAnswer])



  // Improve hint logic for better user experience
  const toggleHint = useCallback(() => {
    setShowHint((prev) => !prev)

    if (!showHint) {
      // Progressive hint system - advance level based on views
      setHintState((prev) => {
        const newViews = prev.views + 1

        // Only advance level after first view or every second view
        const newLevel = newViews === 1 ? 0 : newViews === 3 ? 1 : newViews >= 5 ? 2 : prev.level

        return { views: newViews, level: newLevel }
      })
    }
  }, [showHint])

  const isNextButtonEnabled = useMemo(
    () => answer.trim() && !isSpamming && isAnswerCloseEnough(answer, question.answer || "", SIMILARITY_THRESHOLD),
    [answer, isSpamming, question.answer],
  )

  const getHintContent = useCallback(() => {
    if (!question.answer) return null
    return getHint(question.answer, hintState.level)
  }, [question.answer, hintState.level])
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        if (isLastQuestion && onSubmit) {
          onSubmit()
        } else if (onNext && isNextButtonEnabled) {
          onNext()
        }
      }
    },
    [isLastQuestion, onSubmit, onNext, isNextButtonEnabled],
  )
  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      progressPercentage={progressPercentage}
      quizType="blanks"
      animationKey={question.id}
    >
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-xl leading-relaxed">
          <span>{beforeBlank}</span>
          <div className="relative min-w-[200px] max-w-full">
            <Input
              ref={inputRef}
              className={`px-4 py-3 text-lg border-2 transition-all duration-200 ${
                isFocused
                  ? "border-primary shadow-md ring-2 ring-primary/20"
                  : isAnswered
                    ? "border-success/50 bg-success/5 shadow-sm shadow-success/10"
                    : showValidation
                      ? "border-destructive/50 bg-destructive/5 shadow-sm shadow-destructive/10"
                      : isSpamming
                        ? "border-yellow-500 bg-yellow-50 shadow-sm shadow-yellow-500/10"
                        : "border-muted-foreground/50"
              }`}
              placeholder="Type your answer..."
              value={answer}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              aria-label="Fill in the blank answer"
              aria-invalid={showValidation || isSpamming}
              aria-required="true"
              disabled={isSubmitting}
            />
            {showValidation && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="text-sm text-destructive mt-1 absolute font-medium"
              >
                Please enter an answer before continuing
              </motion.p>
            )}
            {isSpamming && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="text-sm text-yellow-600 mt-1 absolute font-medium"
              >
                Your answer is too similar to the question. Please rephrase it.
              </motion.p>
            )}
          </div>
          <span>{afterBlank}</span>
        </div>
      </div>

      {question.answer && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={toggleHint}
              className={`text-sm flex items-center gap-2 ${
                showHint ? "border-primary text-primary" : "text-muted-foreground"
              }`}
              size="sm"
              aria-expanded={showHint}
              aria-controls="hint-panel"
              disabled={isSubmitting}
            >
              <Lightbulb className={`w-4 h-4 ${showHint ? "text-amber-500" : ""}`} />
              {showHint ? "Hide Hint" : hintState.views > 0 ? `Hint (${hintState.level + 1}/3)` : "Need a Hint?"}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {showHint && (
              <motion.div
                id="hint-panel"
                key={`hint-level-${hintState.level}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="mt-3 text-sm p-4 rounded-md border border-blue-200 bg-blue-50 text-blue-800 shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 mt-0.5 text-amber-500" />
                  <p>{getHintContent()}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <QuizFooter
        onNext={onNext}
        onPrevious={onPrevious}
        onSubmit={onSubmit}
        onRetake={onRetake}
        canGoNext={isNextButtonEnabled}
        canGoPrevious={canGoPrevious}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        showRetake={showRetake}
      />
    </QuizContainer>
  )
})

export default BlanksQuiz
