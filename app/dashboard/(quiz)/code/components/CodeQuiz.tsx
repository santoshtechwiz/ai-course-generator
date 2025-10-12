"use client"

import { useMemo } from "react"
import { QuizFooter } from "@/components/quiz/QuizFooter"
import { UnifiedQuizQuestion, type CodeQuestion as UnifiedCodeQuestion } from "@/components/quiz/UnifiedQuizQuestion"
import { QuizStateProvider } from "@/components/quiz/QuizStateProvider"
import type { CodeQuestion } from "./types"

interface CodeQuizProps {
  question: CodeQuestion
  onAnswer: (answer: string) => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  onNext?: () => void | Promise<void>
  onSubmit?: () => void | Promise<void>
  onRetake?: () => void | Promise<void>
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  showNavigation?: boolean
  showRetake?: boolean
  quizTitle?: string
  quizSubtitle?: string
  difficulty?: string
  category?: string
  timeLimit?: number
  quizSlug?: string  // Added for adaptive feedback
}

const CodeQuiz = ({
  question,
  onAnswer,
  isSubmitting = false,
  questionNumber = 1,
  totalQuestions = 1,
  existingAnswer,
  onNext,
  onSubmit,
  onRetake,
  canGoNext = false,
  canGoPrevious = false,
  isLastQuestion = false,
  showNavigation = true,
  showRetake = false,
  quizTitle = "Code Quiz",
  quizSubtitle = "Analyze the code and choose the best answer",
  difficulty = "Medium",
  category = "Programming",
  timeLimit,
  quizSlug,  // Added for adaptive feedback
}: CodeQuizProps) => {
  // Convert legacy question format to unified format
  const unifiedQuestion: UnifiedCodeQuestion = useMemo(
    () => ({
      id: String(question.id),
      text: question.text || question.question,
      question: question.text || question.question,
      type: "code",
      options: question.options,
      codeSnippet: question.codeSnippet,
      language: question.language,
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
        <div className="w-full h-full flex flex-col space-y-6">
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
            quizSlug={quizSlug}
            enableAdaptiveFeedback={true}
          />

          {showNavigation && (
            <QuizFooter
              onNext={onNext ? () => stateManager.handleNext(onNext) : undefined}
              onPrevious={undefined}
              onSubmit={isLastQuestion && onSubmit ? () => stateManager.handleSubmit(onSubmit) : undefined}
              onRetake={onRetake}
              canGoNext={!!existingAnswer && !isSubmitting}
              canGoPrevious={false}
              isLastQuestion={isLastQuestion}
              isSubmitting={isSubmitting || stateManager.isSubmitting}
              showRetake={showRetake}
              hasAnswer={!!existingAnswer}
              submitState={stateManager.submitState}
              nextState={stateManager.nextState}
            />
          )}
        </div>
      )}
    </QuizStateProvider>
  )
}

export default CodeQuiz
