"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

import FillInTheBlanksQuiz from "./FillInTheBlanksQuiz"
import BlankQuizResults from "./BlankQuizResults"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuiz } from "@/app/context/QuizContext"

export default function BlankQuizContent() {
  const router = useRouter()
  const { state, submitAnswer, completeQuiz, restartQuiz } = useQuiz()

  const {
    quizId,
    slug,
    title,
    questionCount,
    currentQuestionIndex,
    answers,
    isCompleted,
    isLoading,
    error,
    score,
    showAuthPrompt,
  } = state

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Get current question data
  const currentQuestionData = state.quizData?.questions?.[currentQuestionIndex] || null

  // Handle answer submission
  const handleAnswer = (answer: string, timeSpent: number, hintsUsed: boolean, similarity?: number) => {
    const isCorrect = similarity ? similarity > 80 : false

    // Create answer object
    const answerObj = {
      answer,
      timeSpent,
      isCorrect,
      hintsUsed,
      similarity,
    }

    // Submit answer
    submitAnswer(answer, timeSpent, isCorrect)

    // If this is the last question, complete the quiz
    if (currentQuestionIndex >= questionCount - 1) {
      const finalAnswers = [...answers.slice(0, currentQuestionIndex), answerObj]
      completeQuiz(finalAnswers)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !state.quizData || !state.quizData.questions || state.quizData.questions.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading quiz</AlertTitle>
          <AlertDescription>
            {error || "We couldn't load the quiz data. Please try again later."}
            <div className="mt-4">
              <Button onClick={() => router.push("/dashboard/blanks")}>Return to Quiz Creator</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <BlankQuizResults />
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentQuestionData && (
              <FillInTheBlanksQuiz
                question={currentQuestionData}
                onAnswer={handleAnswer}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questionCount}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
