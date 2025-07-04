"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Target, BookOpen, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { HintSystem } from "@/components/quiz/HintSystem"
import { TagsDisplay } from "@/components/quiz/TagsDisplay"
import { DifficultyBadge } from "@/components/quiz/DifficultyBadge"
import { calculateAnswerSimilarity, getSimilarityLabel, getSimilarityFeedback } from "@/lib/utils/text-similarity"
import { generateOpenEndedHints, calculateHintPenalty } from "@/lib/utils/hint-system"
import { OpenEndedQuestion } from "@/app/types/quiz-types"


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
      tags: Array.isArray(openEndedData.tags) ? openEndedData.tags : 
            Array.isArray(question.tags) ? question.tags : [],
    }
  }, [question])
  // Generate hints for this question using actual question hints
  const hints = useMemo(() => {
    // Make sure we have valid arrays for keywords and hints
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
    // Ensure the hintLevel is properly tracked
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

  // Get feedback based on similarity and keyword coverage
  const feedback = useMemo(() => {
    if (!answer.trim()) return null

    const label = getSimilarityLabel(similarity)
    const message = getSimilarityFeedback(similarity)
    const keywordCoverage =
      questionData.keywords.length > 0 ? (keywordsCovered.length / questionData.keywords.length) * 100 : 100

    let color = "text-gray-600"
    let bgColor = "bg-gray-50 dark:bg-gray-950/20"
    let borderColor = "border-gray-200 dark:border-gray-800"
    let icon = Target

    if (similarity >= 0.8 && keywordCoverage >= 70) {
      color = "text-green-600"
      bgColor = "bg-green-50 dark:bg-green-950/20"
      borderColor = "border-green-200 dark:border-green-800"
      icon = CheckCircle
    } else if (similarity >= 0.6 || keywordCoverage >= 50) {
      color = "text-blue-600"
      bgColor = "bg-blue-50 dark:bg-blue-950/20"
      borderColor = "border-blue-200 dark:border-blue-800"
      icon = Target
    } else if (similarity >= 0.4 || keywordCoverage >= 30) {
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

    return { label, message, color, bgColor, borderColor, icon, keywordCoverage }
  }, [answer, similarity, keywordsCovered, questionData.keywords])

  const minLength = 10
  const canProceed = answer.trim().length >= minLength
  const wordCount = answer
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="openended"
      animationKey={question.id}
      quizTitle="Open-Ended Question"
      quizSubtitle="Provide a detailed answer explaining your understanding"
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

        {/* Question */}
        <div className="space-y-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-2">Question</h3>
                  <p className="text-foreground leading-relaxed">{questionData.text}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keywords to cover */}
          {questionData.keywords.length > 0 && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Key concepts to address:</h4>
                <div className="flex flex-wrap gap-2">
                  {questionData.keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant={keywordsCovered.includes(keyword) ? "default" : "outline"}
                      className={cn(
                        "text-xs",
                        keywordsCovered.includes(keyword) ? "bg-green-500 text-white" : "text-muted-foreground",
                      )}
                    >
                      {keywordsCovered.includes(keyword) && "✓ "}
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Answer Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="answer" className="text-sm font-medium text-foreground">
              Your Answer
            </label>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{answer.length} characters</span>
            </div>
          </div>

          <Textarea
            id="answer"
            value={answer}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Provide a detailed explanation... (Ctrl+Enter to submit)"
            className={cn(
              "min-h-[120px] resize-y transition-all",
              isAnswered
                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                : showValidation
                  ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                  : "hover:border-primary focus:border-primary",
            )}
            autoFocus
            aria-label="Enter your detailed answer"
          />

          {showValidation && answer.trim().length < minLength && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Please provide at least {minLength} characters for a meaningful answer
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
                  <div className="flex items-start gap-3">
                    <feedback.icon className={cn("w-5 h-5 mt-0.5", feedback.color)} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-xs font-medium", feedback.color)}>
                          {feedback.label}
                        </Badge>
                        {questionData.answer && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(similarity * 100)}% similarity
                          </Badge>
                        )}
                        {questionData.keywords.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(feedback.keywordCoverage)}% keywords covered
                          </Badge>
                        )}
                        {hintsUsed > 0 && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                            Score: {calculateHintPenalty(hintsUsed)}%
                          </Badge>
                        )}
                      </div>
                      <p className={cn("text-sm leading-relaxed", feedback.color)}>{feedback.message}</p>

                      {questionData.keywords.length > 0 && keywordsCovered.length < questionData.keywords.length && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Consider addressing:{" "}
                          {questionData.keywords.filter((k) => !keywordsCovered.includes(k)).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>        {/* Hint System */}
        <HintSystem 
          hints={hints || []}
          onHintUsed={(hintIndex) => handleHintUsed(hintIndex + 1)}
          questionText={questionData.text}
        />

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
