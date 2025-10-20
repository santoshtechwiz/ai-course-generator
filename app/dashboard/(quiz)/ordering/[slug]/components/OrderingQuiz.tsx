'use client'

import { OrderingQuiz as OrderingQuizComponent } from '@/components/quiz/OrderingQuiz'
import { QuizStateProvider } from '@/components/quiz/QuizStateProvider'
import { QuizFooter } from '@/components/quiz/QuizFooter'
import { UnifiedLoader } from '@/components/loaders'
import type { OrderingQuizQuestion } from '@/app/types/quiz-types'

interface OrderingQuizProps {
  question: OrderingQuizQuestion
  onAnswer: (userOrder: number[], isCorrect: boolean) => void
  onNext?: () => void | Promise<void>
  onSubmit?: () => void | Promise<void>
  onRetake?: () => void | Promise<void>
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: number[]
  canGoNext?: boolean
  isLastQuestion?: boolean
  showRetake?: boolean
  quizTitle?: string
  quizSubtitle?: string
  difficulty?: string
  category?: string
  timeLimit?: number
  quizSlug?: string
}

const OrderingQuiz = ({
  question,
  onAnswer,
  onNext,
  onSubmit,
  onRetake,
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  canGoNext = false,
  isLastQuestion = false,
  showRetake = false,
  quizTitle = 'Ordering Quiz',
  quizSubtitle = 'Put the steps in the correct order',
  difficulty = 'Medium',
  category = 'Sequences',
  timeLimit,
  quizSlug,
}: OrderingQuizProps) => {
  return (
    <QuizStateProvider
      onError={(error) => console.error(error)}
      onSuccess={(message) => console.log(message)}
      globalLoading={isLastQuestion}
    >
      {(stateManager) => (
        <div className="w-full h-full flex flex-col space-y-6 relative">
          {/* Loading overlay when submitting */}
          {stateManager.isSubmitting && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <UnifiedLoader
                state="loading"
                variant="spinner"
                size="lg"
                message="Submitting your quiz answers..."
                className="text-center"
              />
            </div>
          )}

          <OrderingQuizComponent
            question={question}
            onSubmit={onAnswer}
            isSubmitting={isSubmitting}
          />

          <QuizFooter
            onNext={onNext ? () => stateManager.handleNext(onNext) : undefined}
            onPrevious={undefined}
            onSubmit={isLastQuestion && onSubmit ? () => stateManager.handleSubmit(onSubmit) : undefined}
            onRetake={onRetake}
            canGoNext={canGoNext}
            canGoPrevious={false}
            isLastQuestion={isLastQuestion}
            isSubmitting={isSubmitting || stateManager.isSubmitting}
            showRetake={showRetake}
            hasAnswer={!!existingAnswer}
            submitState={stateManager.submitState}
            nextState={stateManager.nextState}
          />
        </div>
      )}
    </QuizStateProvider>
  )
}

export default OrderingQuiz
