"use client"

import { useMemo } from "react"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { UnifiedQuizQuestion, type BlanksQuestion } from "@/components/quiz/UnifiedQuizQuestion"
import { QuizStateProvider } from "@/components/quiz/QuizStateProvider"
import type { BlankQuizQuestion } from "@/app/types/quiz-types"

interface BlanksQuizProps {
  question: BlankQuizQuestion
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

const BlanksQuiz = ({
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
}: BlanksQuizProps) => {
  // Convert legacy question format to unified format
  const unifiedQuestion: BlanksQuestion = useMemo(() => ({
    id: String(question.id),
    text: question.question,
    question: question.question,
    type: 'blanks',
    blanks: 1, // Default to 1 blank
    template: question.question.replace('________', '___'), // Convert legacy blank marker to unified format
    difficulty: question.difficulty || 'medium',
    category: 'Fill in the Blanks',
    tags: question.tags,
    similarityThreshold: question.similarityThreshold,
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
          animationKey={`blanks-${question.id}-${questionNumber}`}
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

export default BlanksQuiz