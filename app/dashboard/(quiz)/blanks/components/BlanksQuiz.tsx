"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Target } from "lucide-react"
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
      setIsAnswered(result.isAcceptable)
    } else {
      setSimilarity(0)
      setIsAnswered(false)
    }
  }, [answer, questionData.answer])

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
      <div className="space-y-6">
        {/* Question Metadata - Only show once */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <DifficultyBadge difficulty={questionData.difficulty} />
            {hintsUsed > 0 && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                {hintsUsed} hint{hintsUsed > 1 ? "s" : ""} used (-{hintsUsed * 5}%)
              </Badge>
            )}
          </div>

          <TagsDisplay tags={questionData.tags} maxVisible={3} />
        </div>

        {/* Question with Blank */}
        <div className="text-center">
          <div className="text-xl font-medium leading-relaxed mb-6 p-6 bg-muted/30 rounded-lg border">
            {questionParts.hasBlank ? (
              <>
                <span className="text-foreground">{questionParts.before}</span>
                <Input
                  value={answer}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Your answer"
                  className={cn(
                    "inline-block mx-3 px-4 py-2 text-center font-medium min-w-[200px] border-2 border-dashed transition-all",
                    isAnswered
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                      : showValidation
                        ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                        : "border-muted-foreground/50 hover:border-primary focus:border-primary",
                  )}
                  autoFocus
                  aria-label="Fill in the blank"
                />
                <span className="text-foreground">{questionParts.after}</span>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-foreground">{questionData.text}</p>
                <Input
                  value={answer}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Your answer"
                  className={cn(
                    "max-w-md mx-auto px-4 py-2 text-center font-medium border-2 transition-all",
                    isAnswered
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300"
                      : showValidation
                        ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
                        : "border-muted-foreground/50 hover:border-primary focus:border-primary",
                  )}
                  autoFocus
                  aria-label="Enter your answer"
                />
              </div>
            )}
          </div>

          {showValidation && !answer.trim() && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 mt-2 flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Please enter an answer before continuing
            </motion.p>
          )}
        </div>

        {/* Answer Feedback */}
        <AnimatePresence>
          {feedback && answer.trim() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={cn("border-2", feedback.borderColor, feedback.bgColor)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <feedback.icon className={cn("w-5 h-5", feedback.color)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={cn("text-xs font-medium", feedback.color)}>
                          {feedback.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(similarity * 100)}% match
                        </Badge>
                        {hintsUsed > 0 && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            Score: {calculateHintPenalty(hintsUsed)}%
                          </Badge>
                        )}
                        {similarity < minimumSimilarityThreshold && (
                          <Badge variant="outline" className="text-xs text-blue-600">
                            Need {Math.round(minimumSimilarityThreshold * 100)}%+ to proceed
                          </Badge>
                        )}
                      </div>
                      <p className={cn("text-sm leading-relaxed", feedback.color)}>{feedback.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint System */}
        <HintSystem hints={hints} onHintUsed={handleHintUsed} maxHints={3} allowDirectAnswer={false} />

        {/* Footer */}
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
      </div>
    </QuizContainer>
  )
}
