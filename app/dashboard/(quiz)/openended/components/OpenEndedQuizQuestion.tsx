"use client"

import { useCallback, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/store"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { OpenEndedQuestion } from "@/types/quiz"
import { selectQuizStatus, saveAnswer, selectAnswerForQuestion } from "@/store/slices/quiz-slice"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { QuizStateProvider } from "@/components/quiz/QuizStateProvider"
import { toast } from "sonner"

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
      setIsTyping(true)
      setWordCount(newAnswer.trim().split(/\s+/).filter(word => word.length > 0).length)
      
      // Debounce the save to Redux
      const timeoutId = setTimeout(() => {
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
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "hard":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  const getWordCountColor = () => {
    if (wordCount < 10) return "text-red-500"
    if (wordCount < 25) return "text-orange-500"
    if (wordCount < 50) return "text-yellow-500"
    return "text-green-500"
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
            "min-h-[150px] resize-none transition-all duration-200 focus:min-h-[200px] focus:ring-2 focus:ring-primary md:min-h-[200px]",
            "border-2 border-border/60 hover:border-primary/40 focus:border-primary",
            answerText.length > 0 && "border-primary/60"
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
