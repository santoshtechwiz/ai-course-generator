"use client"

import { useMemo } from "react"
import { UnifiedQuizQuestion, type MCQQuestion } from "@/components/quiz/UnifiedQuizQuestion"
import { QuizStateProvider } from "@/components/quiz/QuizStateProvider"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { Loader } from "@/components/loader"

interface McqQuizProps {
  question: {
    id: string
    text?: string
    question?: string
    options: string[]
  }
  onAnswer: (answer: string) => void
  onNext?: () => void | Promise<void>
  onSubmit?: () => void | Promise<void>
  onRetake?: () => void | Promise<void>
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  canGoNext?: boolean
  isLastQuestion?: boolean
  showRetake?: boolean
  quizTitle?: string
  quizSubtitle?: string
  difficulty?: string
  category?: string
  timeLimit?: number
}

const McqQuiz = ({
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
  quizTitle = "Multiple Choice Quiz",
  quizSubtitle = "Choose the best answer for each question",
  difficulty = "Medium",
  category = "General Knowledge",
  timeLimit,
}: McqQuizProps) => {
  // Convert legacy question format to unified format
  const unifiedQuestion: MCQQuestion = useMemo(
    () => ({
      id: question.id,
      text: question.text || question.question,
      question: question.text || question.question,
      type: "mcq",
      options: question.options,
      difficulty: difficulty.toLowerCase() as "easy" | "medium" | "hard",
      category,
    }),
    [question, difficulty, category],
  )

  const handleAnswer = (answer: string, similarity?: number, hintsUsed?: number) => {
    onAnswer(answer)
    return true
  }

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
              <Loader message="Submitting quiz..." size="large" />
            </div>
          )}
          
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

export default McqQuiz
