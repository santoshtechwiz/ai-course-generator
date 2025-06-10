"use client"

import type React from "react"
import {
  useState,
  useEffect,
  useCallback,
  memo,
  useRef,
  useMemo
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Flag,
  Lightbulb
} from "lucide-react"
import type { BlankQuestion } from "./types"
import {
  getBestSimilarityScore,
  isAnswerCloseEnough,
  getHint
} from "@/lib/utils/text-similarity"

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
  isSubmitting?: boolean
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
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
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  isSubmitting = false
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
      afterBlank: after || ""
    }
  }, [question.question])

  const progressPercentage = useMemo(
    () => ((questionNumber ?? 0) / (totalQuestions ?? 1)) * 100,
    [questionNumber, totalQuestions]
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
          console.error("Error processing answer:", err);
          // Handle potential errors in similarity calculation
        }
      }, DEBOUNCE_MS)

      // Notify immediately for form tracking
      onAnswer(value)
    },
    [onAnswer, question.question, question.answer, isAnswered]
  )

  // Focus input field on mount for better UX
  useEffect(() => {
    if (inputRef.current && !existingAnswer) {
      inputRef.current.focus()
    }
  }, [existingAnswer])

  const handleNext = useCallback(() => {
    if (!answer.trim()) {
      setShowValidation(true)
      return
    }
    onNext?.()
  }, [answer, onNext])

  const handleSubmit = useCallback(() => {
    if (!answer.trim()) {
      setShowValidation(true)
      return
    }
    onSubmit?.()
  }, [answer, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        isLastQuestion ? handleSubmit() : handleNext()
      }
    },
    [handleNext, handleSubmit, isLastQuestion]
  )

  // Improve hint logic for better user experience
  const toggleHint = useCallback(() => {
    setShowHint((prev) => !prev)

    if (!showHint) {
      // Progressive hint system - advance level based on views
      setHintState((prev) => {
        const newViews = prev.views + 1
        
        // Only advance level after first view or every second view
        const newLevel = newViews === 1 ? 0 : 
                         newViews === 3 ? 1 :
                         newViews >= 5 ? 2 : prev.level;
                         
        return { views: newViews, level: newLevel }
      })
    }
  }, [showHint])

  const isNextButtonEnabled = useMemo(
    () =>
      answer.trim() &&
      !isSpamming &&
      isAnswerCloseEnough(answer, question.answer || "", SIMILARITY_THRESHOLD),
    [answer, isSpamming, question.answer]
  )

const getHintContent = useCallback(() => {
  if (!question.answer) return null;
  return getHint(question.answer, hintState.level);
}, [question.answer, hintState.level]);


  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="overflow-hidden border-2 border-border/50 shadow-lg">
        <CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                {questionNumber}
              </span>
              <div>
                <Label className="text-lg font-semibold text-foreground">
                  Question {questionNumber} of {totalQuestions}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in the blank with the appropriate term
                </p>
              </div>
            </div>
            {isAnswered && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <CheckCircle className="h-6 w-6 text-success" />
              </motion.div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 text-xl leading-relaxed">
              <span>{beforeBlank}</span>
              <div className="relative min-w-[200px] max-w-full">
                <Input
                  ref={inputRef}
                  className={`px-4 py-3 text-lg border-2 transition-all duration-200 ${
                    isFocused
                      ? "border-primary shadow-md"
                      : isAnswered
                      ? "border-success/50 bg-success/5"
                      : showValidation
                      ? "border-destructive/50 bg-destructive/5"
                      : isSpamming
                      ? "border-yellow-500 bg-yellow-50"
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
                />
                {showValidation && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive mt-1 absolute"
                  >
                    Please enter an answer before continuing
                  </motion.p>
                )}
                {isSpamming && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-yellow-600 mt-1 absolute"
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
                    transition={{ duration: 0.2 }}
                    className="mt-3 text-sm p-4 rounded-md border border-blue-200 bg-blue-50 text-blue-800"
                  >
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 mt-0.5" />
                      <p>{getHintContent()}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-border/40">
            <div className="flex gap-3">
              {canGoPrevious && (
                <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {!isLastQuestion ? (
                <Button onClick={handleNext} disabled={!isNextButtonEnabled} className="flex items-center gap-2 min-w-[120px]" size="lg">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!isNextButtonEnabled} className="flex items-center gap-2 min-w-[140px]" size="lg">
                  <Flag className="w-4 h-4" />
                  Finish Quiz
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

export default BlanksQuiz
