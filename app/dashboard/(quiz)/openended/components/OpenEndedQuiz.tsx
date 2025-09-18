"use client"

import { useMemo } from "react"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { UnifiedQuizQuestion, type OpenEndedQuestion as UnifiedOpenEndedQuestion } from "@/components/quiz/UnifiedQuizQuestion"
import { QuizStateProvider } from "@/components/quiz/QuizStateProvider"
import type { OpenEndedQuestion } from "@/app/types/quiz-types"

interface OpenEndedQuizProps {
  question: OpenEndedQuestion
  questionNumber: number
  totalQuestions: number
  existingAnswer?: string
  onAnswer: (answer: string, similarity?: number, hintsUsed?: number) => boolean
  onNext?: () => void | Promise<void>
  onPrevious?: () => void | Promise<void>
  onSubmit?: () => void | Promise<void>
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  timeSpent?: number
}

const OpenEndedQuiz = ({
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
}: OpenEndedQuizProps) => {
  // Convert legacy question format to unified format
  const unifiedQuestion: UnifiedOpenEndedQuestion = useMemo(() => ({
    id: String(question.id),
    text: question.question,
    question: question.question,
    type: 'openended',
    difficulty: question.difficulty || 'medium',
    category: 'Open-Ended',
    tags: question.tags,
    similarityThreshold: question.similarityThreshold,
    minWords: 10, // Default minimum words
    maxWords: 500, // Default maximum words
  }), [question])

  const handleAnswer = (answer: string, similarity?: number, hintsUsed?: number) => {
    return onAnswer(answer, similarity, hintsUsed)
  }

  return (
    <QuizStateProvider
      onError={(error) => console.error(error)}
      onSuccess={(message) => console.log(message)}
      globalLoading={isLastQuestion}
    >
      {(stateManager) => (
        <QuizContainer
          animationKey={`openended-${question.id}-${questionNumber}`}
          fullWidth={true}
          showProgress={true}
          progressValue={Math.round(((questionNumber - 1) / totalQuestions) * 100)}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
        >
          <UnifiedQuizQuestion
            question={unifiedQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            existingAnswer={existingAnswer}
            onAnswer={handleAnswer}
            onNext={onNext}
            onSubmit={onSubmit}
            canGoNext={canGoNext}
            isLastQuestion={isLastQuestion}
            isSubmitting={false}
          />

          <QuizFooter
            onNext={onNext ? () => stateManager.handleNext(onNext) : undefined}
            onPrevious={onPrevious ? () => onPrevious() : undefined}
            onSubmit={isLastQuestion && onSubmit ? () => stateManager.handleSubmit(onSubmit) : undefined}
            onRetake={undefined}
            canGoNext={!!existingAnswer && !stateManager.isSubmitting}
            canGoPrevious={canGoPrevious}
            isLastQuestion={isLastQuestion}
            isSubmitting={stateManager.isSubmitting}
            showRetake={false}
            hasAnswer={!!existingAnswer}
            submitState={stateManager.submitState}
            nextState={stateManager.nextState}
          />
        </QuizContainer>
      )}
    </QuizStateProvider>
  )
}

export default OpenEndedQuiz
