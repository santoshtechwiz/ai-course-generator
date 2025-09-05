"use client"

import { useCallback, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { OpenEndedQuestion } from "@/types/quiz"
import { selectQuizStatus, selectQuizAnswers } from "@/store/slices/quiz/quiz-slice"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { QuizStateProvider } from "@/components/quiz/QuizStateProvider"
import { toast } from "sonner"
import { useProgressEvents } from "@/utils/progress-events"
import { useSession } from "next-auth/react"

interface QuizQuestionProps {
  question: OpenEndedQuestion
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
  onAnswer: (answer: string, elapsedTime: number, hintsUsed: boolean) => void
  onNext?: () => void | Promise<void>
  onPrevious?: () => void | Promise<void>
  onSubmit?: () => void | Promise<void>
  onRetake?: () => void | Promise<void>
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
  const [isTyping, setIsTyping] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const { data: session } = useSession()
  const { dispatchQuestionAnswered } = useProgressEvents()
  const userId = session?.user?.id || ''

  // Get current answer from Redux store
  const allAnswers = useAppSelector(selectQuizAnswers)
  const currentAnswer = allAnswers[question.id]
  const quizStatus = useAppSelector(selectQuizStatus)

  // Parse hints from question data
  const hints = useMemo(() => {
    if (!question?.openEndedQuestion?.tags) return []
    const tags = question.openEndedQuestion.tags
    return Array.isArray(tags) ? tags : [tags]
  }, [question?.openEndedQuestion?.tags])

  const isSubmitting = quizStatus === "submitting"
  const answerText = currentAnswer ? (currentAnswer as any).text || "" : ""

  const handleAnswerChange = useCallback(
    (newAnswer: string) => {
      setIsTyping(true)
      setWordCount(newAnswer.trim().split(/\s+/).filter(word => word.length > 0).length)
      
      // Debounce the save to Redux
      const timeoutId = setTimeout(() => {
        // Dispatch question answered event instead of direct state mutation
        if (userId && question.id) {
          // For open-ended questions, we'll mark as correct for now
          // In a real implementation, you'd check against the expected answer
          dispatchQuestionAnswered(
            userId,
            String(question.id),
            'openended-quiz', // quizId - should be passed from parent
            0, // questionIndex - should be passed from parent
            undefined,
            newAnswer,
            true, // isCorrect - simplified for demo
            0 // timeSpent
          )
        }
        setIsTyping(false)
      }, 300)

      return () => clearTimeout(timeoutId)
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
        return "bg-emerald-500 text-primary-foreground"
      case "medium":
        return "bg-amber-500 text-primary-foreground"
      case "hard":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-primary text-primary-foreground"
    }
  }

  const getWordCountColor = () => {
    if (wordCount < 10) return "text-destructive"
    if (wordCount < 25) return "text-amber-600"
    if (wordCount < 50) return "text-amber-500"
    return "text-emerald-600 dark:text-emerald-400"
  }

  return (
    <QuizStateProvider
      onError={(error) => toast.error(error)}
      onSuccess={(message) => toast.success(message || "Answer saved!")}
      globalLoading={isLastQuestion}
    >
      {(stateManager) => (        <QuizContainer
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          quizType="openended"
          animationKey={String(question.id)}
          contentClassName="space-y-4"
          quizTitle="Open-Ended Question"
          quizSubtitle="Answer the following question in detail:"
        >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn("text-xs", getDifficultyColor("medium"))}>
            Medium
          </Badge>
          
          {/* Word count indicator */}
          <Badge variant="outline" className={cn("text-xs", getWordCountColor())}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Badge>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Badge variant="secondary" className="text-xs">
                Typing...
              </Badge>
            </motion.div>
          )}
        </div>
      </div>
      
      <motion.h2
        className="text-2xl font-bold leading-tight text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        data-testid="question-text"
      >
        {(question as any).text || question.question || "Question text not available"}
      </motion.h2>

      <div className="relative">
        <Textarea
          value={answerText}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          className={cn(
            "min-h-[180px] md:min-h-[220px] resize-none transition-all duration-200",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "border border-border bg-background text-foreground placeholder:text-muted-foreground",
            answerText.length > 0 && "border-primary/50"
          )}
          data-testid="answer-textarea"
          disabled={isSubmitting || stateManager.isSubmitting}
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
        
        {/* Character count */}
        <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
          {answerText.length} characters
        </div>
      </div>

      <AnimatePresence>
        {hints.length > 0 && (
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-sm font-medium text-muted-foreground">Keywords to consider:</p>
            <div className="flex flex-wrap gap-2">
              {hints.map((hint: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Badge variant="outline" className="text-xs">
                    {hint}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuizFooter
        onSubmit={onSubmit && isLastQuestion ? () => stateManager.handleSubmit(onSubmit) : undefined}
        onNext={onNext && !isLastQuestion ? () => stateManager.handleNext(onNext) : undefined}
        onPrevious={onPrevious}
        onRetake={onRetake}
        canGoNext={!!answerText.trim()}
        canGoPrevious={false}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting || stateManager.isSubmitting}
        showRetake={showRetake}
        submitState={stateManager.submitState}
        nextState={stateManager.nextState}
      />
    </QuizContainer>
      )}
    </QuizStateProvider>
  )
}

export default OpenEndedQuizQuestion
