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
    if (!answer.trim()) {
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
      quizType="blanks"
      animationKey={String(question.id)}
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
          <motion.div variants={itemVariants} className="w-full">
            <Card className="w-full border-0 shadow-lg bg-card">
              <div className="bg-primary h-1"></div>
              <CardContent className="w-full p-6 sm:p-8">
                <div className="w-full space-y-6">
                  {/* Header Section */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                      <FileText className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-foreground">Fill in the Blank</h3>
                      {hintsUsed > 0 && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          <Lightbulb className="w-3 h-3 mr-1" />
                          {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="w-full">
                    {questionParts.hasBlank ? (
                      <div className="w-full space-y-6 text-center">
                        <div className="w-full max-w-4xl mx-auto">
                          <div className="text-lg sm:text-xl leading-relaxed mb-6">
                            <span className="text-foreground break-words">{questionParts.before}</span>
                          </div>

                          <motion.div
                            variants={inputFocusVariants}
                            animate={isFocused ? "focused" : "unfocused"}
                            className="relative w-full max-w-md mx-auto mb-6"
                          >
                            <Input
                              value={answer}
                              onChange={handleInputChange}
                              onKeyDown={handleKeyDown}
                              onFocus={() => setIsFocused(true)}
                              onBlur={() => setIsFocused(false)}
                              placeholder="Your answer"
                              className={cn(
                                "w-full text-center font-semibold border-2 border-dashed rounded-lg transition-all duration-300",
                                "text-base sm:text-lg py-4 px-4 min-h-[56px] bg-background",
                                isAnswered
                                  ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                                  : showValidation
                                    ? "border-destructive bg-destructive/10 text-destructive"
                                    : "border-primary/30 hover:border-primary/50 focus:border-primary",
                              )}
                              autoFocus
                              aria-label="Fill in the blank"
                            />

                            {isAnswered && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                              >
                                <CheckCircle className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </motion.div>

                          <div className="text-lg sm:text-xl leading-relaxed">
                            <span className="text-foreground break-words">{questionParts.after}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full space-y-6 text-center">
                        <p className="text-foreground break-words text-lg leading-relaxed max-w-4xl mx-auto">
                          {questionData.text}
                        </p>
                        <motion.div
                          variants={inputFocusVariants}
                          animate={isFocused ? "focused" : "unfocused"}
                          className="relative w-full max-w-md mx-auto"
                        >
                          <Input
                            value={answer}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder="Enter your answer"
                            className={cn(
                              "w-full text-center font-semibold border-2 border-dashed rounded-lg transition-all duration-300",
                              "text-base sm:text-lg py-4 px-4 min-h-[56px] bg-background",
                              isAnswered
                                ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                                : showValidation
                                  ? "border-destructive bg-destructive/10 text-destructive"
                                  : "border-primary/30 hover:border-primary/50 focus:border-primary",
                            )}
                            autoFocus
                            aria-label="Enter your answer"
                          />

                          {isAnswered && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                              <CheckCircle className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {/* Success Indicator */}
                  {answer.trim() && similarity >= 0.6 && (
                    <div className="flex items-center justify-center pt-2">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Good answer!</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Validation Error */}
            {showValidation && !answer.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-3 text-sm text-destructive mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Please enter an answer before continuing</span>
              </motion.div>
            )}
          </motion.div>

          {/* Hint System */}
          <motion.div variants={itemVariants} className="w-full max-w-4xl mx-auto">
            <HintSystem
              hints={hints}
              onHintUsed={handleHintUsed}
              userInput={answer}
              questionText={questionData.text}
              maxHints={3}
            />
          </motion.div>

          {/* Footer */}
          <motion.div variants={itemVariants} className="w-full max-w-4xl mx-auto">
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
