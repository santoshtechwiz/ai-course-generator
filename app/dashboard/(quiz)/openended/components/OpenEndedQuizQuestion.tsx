"use client"

import { useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { OpenEndedQuestion } from "@/types/quiz"
import { selectQuizStatus, saveAnswer, selectAnswerForQuestion } from "@/store/slices/quiz-slice"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"

interface QuizQuestionProps {
  question: OpenEndedQuestion
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
  onAnswer: (answer: string, elapsedTime: number, hintsUsed: boolean) => void
  onNext?: () => void
  onPrevious?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  showRetake?: boolean
}

export function OpenEndedQuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  isLastQuestion,
  onAnswer,
  onNext,
  onPrevious,
  onSubmit,
  onRetake,
  showRetake = false,
}: QuizQuestionProps) {
  const dispatch = useAppDispatch()

  // Get current answer from Redux store
  const currentAnswer = useAppSelector((state) => selectAnswerForQuestion(state, question.id))
  const quizStatus = useAppSelector(selectQuizStatus)

  // Parse hints from question data
  const hints = useMemo(() => {
    if (!question?.keywords) return []
    return Array.isArray(question.keywords) ? question.keywords : []
  }, [question?.keywords])

  const isSubmitting = quizStatus === "submitting"
  const answerText = currentAnswer ? (currentAnswer as any).text || "" : ""

  const handleAnswerChange = useCallback(
    (newAnswer: string) => {
      // Save answer to Redux immediately on change
      dispatch(
        saveAnswer({
          questionId: question.id,
          answer: {
            questionId: question.id,
            text: newAnswer,
            timestamp: Date.now(),
          } as any,
        }),
      )
    },
    [dispatch, question.id],
  )

  const handleSubmitAnswer = useCallback(() => {
    if (!answerText.trim() || isSubmitting) return false

    // Call parent handler with current answer
    onAnswer(answerText, 0, false) // Timer and hints managed elsewhere
    return true
  }, [answerText, isSubmitting, onAnswer])

  const getDifficultyColor = (difficulty = "medium") => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "hard":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="openended"
      animationKey={question.id}
      contentClassName="space-y-4"
      quizTitle="Open-Ended Question"
      quizSubtitle="Answer the following question in detail:"
    >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn("text-white", getDifficultyColor("medium"))}>
            Medium
          </Badge>
        </div>
      </div>
      
      <motion.h2
        className="text-2xl font-bold leading-tight text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        data-testid="question-text"
      >
        {question.text}
      </motion.h2>

      <Textarea
        value={answerText}
        onChange={(e) => handleAnswerChange(e.target.value)}
        placeholder="Type your answer here..."
        className="min-h-[150px] resize-none transition-all duration-200 focus:min-h-[200px] focus:ring-2 focus:ring-primary md:min-h-[200px]"
        data-testid="answer-textarea"
        disabled={isSubmitting}
        aria-label="Your answer"
        autoComplete="off"
        onKeyDown={(e) => {
          // Submit with Ctrl+Enter or Cmd+Enter
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (answerText.trim()) {
              isLastQuestion ? onSubmit?.() : onNext?.();
            }
          }
        }}
      />

      {hints.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Keywords to consider:</p>
          <div className="flex flex-wrap gap-2">
            {hints.map((hint, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {hint}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <QuizFooter
        onSubmit={onSubmit || (() => handleSubmitAnswer() && isLastQuestion)}
        onNext={onNext || (!isLastQuestion ? () => handleSubmitAnswer() && onNext?.() : undefined)}
        onPrevious={onPrevious}
        onRetake={onRetake}
        canGoNext={!!answerText.trim()}
        canGoPrevious={false}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        showRetake={showRetake}
      />
    </QuizContainer>
  )
}

export default OpenEndedQuizQuestion
