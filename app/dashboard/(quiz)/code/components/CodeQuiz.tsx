"use client"

import { motion } from "framer-motion"
import { useAppDispatch } from "@/store"
import { saveAnswer } from "@/store/slices/quiz-slice"
import type { CodeQuestion } from "./types"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import CodeQuizOptions from "./CodeQuizOptions"
import { QuizContainer } from "@/components/quiz/QuizContainer"
import { QuizFooter } from "@/components/quiz/QuizFooter"

interface CodeQuizProps {
  question: CodeQuestion
  onAnswer: (answer: string) => void
  isSubmitting?: boolean
  questionNumber?: number
  totalQuestions?: number
  existingAnswer?: string
  onNext?: () => void
  onSubmit?: () => void
  onRetake?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isLastQuestion?: boolean
  showNavigation?: boolean
  showRetake?: boolean
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
}: CodeQuizProps) => {
  const dispatch = useAppDispatch()

  const handleAnswerSelection = (option: string) => {
    if (isSubmitting) return

    // Simple validation for plain array of options
    if (!Array.isArray(question.options)) return
    if (!question.options.includes(option)) return

    onAnswer(option)

    try {
      dispatch(
        saveAnswer({
          questionId: String(question.id),
          answer: {
            questionId: question.id,
            selectedOptionId: option,
            timestamp: Date.now(),
            type: "code",
          },
        })
      )
    } catch (error) {
      console.error("Redux dispatch failed:", error)
    }
  }

  const hasAnswer = !!existingAnswer

  return (
    <QuizContainer
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      quizType="code"
      animationKey={question.id}
    >
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {question.text || question.question}
          </h3>
        </div>

        {question.codeSnippet && (
          <div className="rounded-md overflow-hidden">
            <SyntaxHighlighter
              language={question.language || "javascript"}
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{
                margin: 0,
                borderRadius: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              {question.codeSnippet}
            </SyntaxHighlighter>
          </div>
        )}

        <CodeQuizOptions
          options={question.options}
          selectedOption={existingAnswer ?? null}
          onSelect={handleAnswerSelection}
          disabled={isSubmitting}
        />

        {!hasAnswer && (
          <div className="text-center text-sm text-muted-foreground">
            Select an answer to continue
          </div>
        )}
      </div>

      {showNavigation && (
        <QuizFooter
          onNext={onNext}
          onPrevious={canGoPrevious ? () => {} : undefined}
          onSubmit={onSubmit}
          onRetake={onRetake}
          canGoNext={hasAnswer && canGoNext}
          canGoPrevious={canGoPrevious}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          showRetake={showRetake}
          className="mt-6"
        />
      )}
    </QuizContainer>
  )
}

export default CodeQuiz
