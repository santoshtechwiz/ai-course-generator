"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Target, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { TagsDisplay } from "@/components/quiz/TagsDisplay"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { calculateAnswerSimilarity, getSimilarityLabel, getSimilarityFeedback } from "@/lib/utils/text-similarity"
import { generateBlanksHints, calculateHintPenalty } from "@/lib/utils/hint-system"
import type { BlankQuestion } from "./types"

interface BlanksQuizProps {
  question: BlankQuestion
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

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.6,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
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
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -10,
    transition: { duration: 0.2 },
  },
}

const inputFocusVariants = {
  focused: {
    scale: 1.02,
    boxShadow: "0 0 0 3px rgba(var(--primary), 0.1)",
    transition: { duration: 0.2 },
  },
  unfocused: {
    scale: 1,
    boxShadow: "0 0 0 0px rgba(var(--primary), 0)",
    transition: { duration: 0.2 },
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
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  // Extract question data with proper fallbacks
  const questionData = useMemo(() => {
    const openEndedData = question.openEndedQuestion || {}
    return {
      text: question.question || question.text || "",
      answer: question.answer || openEndedData.correctAnswer || "",
      hints: openEndedData.hints || question.hints || [],
      difficulty: openEndedData.difficulty || question.difficulty || "Medium",
      tags: openEndedData.tags || question.tags || [],
    }
  }, [question])

  // Generate hints for this question using actual question hints
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

      // Show success animation when answer becomes correct
      if (!wasAnswered && result.isAcceptable) {
        setShowSuccessAnimation(true)
        setTimeout(() => setShowSuccessAnimation(false), 1000)
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

  const handleHintUsed = useCallback((hintLevel: number) => {
    setHintsUsed((prev) => Math.max(prev, hintLevel))
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

  // Get feedback based on similarity
  const feedback = useMemo(() => {
    if (!answer.trim()) return null

    const label = getSimilarityLabel(similarity)
    const message = getSimilarityFeedback(similarity)

    let color = "text-gray-600"
    let bgColor = "bg-gray-50 dark:bg-gray-950/20"
    let borderColor = "border-gray-200 dark:border-gray-800"
    let icon = Target

    if (similarity >= 0.85) {
      color = "text-green-600"
      bgColor = "bg-green-50 dark:bg-green-950/20"
      borderColor = "border-green-200 dark:border-green-800"
      icon = CheckCircle
    } else if (similarity >= 0.65) {
      color = "text-blue-600"
      bgColor = "bg-blue-50 dark:bg-blue-950/20"
      borderColor = "border-blue-200 dark:border-blue-800"
      icon = Target
    } else if (similarity >= 0.4) {
      color = "text-yellow-600"
      bgColor = "bg-yellow-50 dark:bg-yellow-950/20"
      borderColor = "border-yellow-200 dark:border-yellow-800"
      icon = AlertCircle
    } else {
      color = "text-red-600"
      bgColor = "bg-red-50 dark:bg-red-950/20"
      borderColor = "border-red-200 dark:border-red-800"
      icon = AlertCircle
    }

    return { label, message, color, bgColor, borderColor, icon }
  }, [answer, similarity])

  const canProceed = answer.trim() && similarity >= 0.7
  const minimumSimilarityThreshold = 0.7

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="w-full">
      <QuizContainer
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        quizType="blanks"
        animationKey={question.id}
        quizTitle="Fill in the Blank"
        quizSubtitle="Complete the sentence with the correct word or phrase"
        timeSpent={timeSpent}
        difficulty={questionData.difficulty.toLowerCase() as "easy" | "medium" | "hard"}
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Question Metadata */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-border/50"
          >
            <div className="flex items-center gap-3">
              <DifficultyBadge difficulty={questionData.difficulty} />
              {hintsUsed > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Badge
                    variant="outline"
                    className="text-xs text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/20"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used (-{hintsUsed * 5}%)
                  </Badge>
                </motion.div>
              )}
              {showSuccessAnimation && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, rotate: -180 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0, rotate: 180 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Badge className="bg-green-500 text-white border-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Correct!
                  </Badge>
                </motion.div>
              )}
            </div>

            <TagsDisplay tags={questionData.tags} maxVisible={3} />
          </motion.div>

          {/* Question with Blank */}
          <motion.div variants={itemVariants} className="text-center">
            <div className="text-lg sm:text-xl font-medium leading-relaxed mb-6 p-4 sm:p-6 bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 rounded-xl border border-border/30 shadow-sm">
              {questionParts.hasBlank ? (
                <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                  <span className="text-foreground">{questionParts.before}</span>
                  <motion.div
                    variants={inputFocusVariants}
                    animate={isFocused ? "focused" : "unfocused"}
                    className="relative inline-block"
                  >
                    <Input
                      value={answer}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Your answer"
                      className={cn(
                        "inline-block mx-2 px-4 py-2 text-center font-medium min-w-[180px] sm:min-w-[200px] border-2 border-dashed transition-all duration-300",
                        isAnswered
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 shadow-green-200/50 shadow-lg"
                          : showValidation
                            ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 animate-pulse"
                            : "border-muted-foreground/50 hover:border-primary focus:border-primary focus:shadow-primary/20 focus:shadow-lg",
                      )}
                      autoFocus
                      aria-label="Fill in the blank"
                    />
                    {isAnswered && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                  <span className="text-foreground">{questionParts.after}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-foreground">{questionData.text}</p>
                  <motion.div
                    variants={inputFocusVariants}
                    animate={isFocused ? "focused" : "unfocused"}
                    className="relative max-w-md mx-auto"
                  >
                    <Input
                      value={answer}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Your answer"
                      className={cn(
                        "px-4 py-3 text-center font-medium border-2 transition-all duration-300 text-base",
                        isAnswered
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 shadow-green-200/50 shadow-lg"
                          : showValidation
                            ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 animate-pulse"
                            : "border-muted-foreground/50 hover:border-primary focus:border-primary focus:shadow-primary/20 focus:shadow-lg",
                      )}
                      autoFocus
                      aria-label="Enter your answer"
                    />
                    {isAnswered && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>

            {showValidation && !answer.trim() && (
              <motion.div
                variants={feedbackVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-center justify-center gap-2 text-sm text-red-600 mt-2"
              >
                <AlertCircle className="w-4 h-4 animate-bounce" />
                <span className="font-medium">Please enter an answer before continuing</span>
              </motion.div>
            )}
          </motion.div>

          {/* Answer Feedback */}
          <AnimatePresence mode="wait">
            {feedback && answer.trim() && (
              <motion.div variants={feedbackVariants} initial="hidden" animate="visible" exit="exit" layout>
                <Card className={cn("border-2 shadow-lg", feedback.borderColor, feedback.bgColor)}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                      >
                        <feedback.icon className={cn("w-6 h-6 flex-shrink-0", feedback.color)} />
                      </motion.div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn("text-xs font-medium", feedback.color)}>
                            {feedback.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            {Math.round(similarity * 100)}% match
                          </Badge>
                          {hintsUsed > 0 && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                              Score: {calculateHintPenalty(hintsUsed)}%
                            </Badge>
                          )}
                          {similarity < minimumSimilarityThreshold && (
                            <Badge variant="outline" className="text-xs text-blue-600 animate-pulse">
                              Need {Math.round(minimumSimilarityThreshold * 100)}%+ to proceed
                            </Badge>
                          )}
                        </div>
                        <motion.p
                          className={cn("text-sm leading-relaxed", feedback.color)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {feedback.message}
                        </motion.p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint System */}
          <motion.div variants={itemVariants}>
            <HintSystem hints={hints} onHintUsed={handleHintUsed} />
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
        </div>
      </QuizContainer>
    </motion.div>
  )
}
