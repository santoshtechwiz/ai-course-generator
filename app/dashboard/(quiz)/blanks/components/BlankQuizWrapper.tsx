"use client"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

import FillInTheBlanksQuiz from "./FillInTheBlanksQuiz"
import BlankQuizResults from "./BlankQuizResults"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import { GuestPrompt } from "../../components/GuestSignInPrompt"

interface BlankQuizWrapperProps {
  quizData: any
  slug: string
}

// This is the main wrapper that uses the provider
export default function BlankQuizWrapper({ quizData, slug }: BlankQuizWrapperProps) {
  return (
    <QuizProvider quizData={quizData} slug={slug}>
      <BlankQuizContent quizData={quizData} slug={slug} />
    </QuizProvider>
  )
}

// This component consumes the context
function BlankQuizContent({ quizData, slug }: { quizData: any; slug: string }) {
  const router = useRouter()
  const { state, submitAnswer, completeQuiz, restartQuiz } = useQuiz()

  const {
    quizId,
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

  // Get current question data
  const currentQuestionData = quizData?.questions?.[currentQuestionIndex] || null

  // Handle answer submission
  const handleAnswer = (answer: string, timeSpent: number, hintsUsed: boolean, similarity?: number) => {
    // Calculate if the answer is correct based on similarity
    const isCorrect = similarity ? similarity > 80 : false

    // Create answer object with all required properties
    const answerObj = {
      answer,
      timeSpent,
      isCorrect,
      hintsUsed,
      similarity: similarity || 0,
    }

    // Submit answer to the context
    submitAnswer(answer, timeSpent, isCorrect)

    // If this is the last question, complete the quiz
    if (currentQuestionIndex >= questionCount - 1) {
      // Create a complete array of answers including the current one
      const finalAnswers = [...answers]
      finalAnswers[currentQuestionIndex] = answerObj

      // Filter out any null answers before completing
      const validAnswers = finalAnswers.filter((a) => a !== null)

      // Add a small delay before completing the quiz
      setTimeout(() => {
        completeQuiz(validAnswers)
      }, 800)
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
  if (error || !quizData || !quizData.questions || quizData.questions.length === 0) {
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
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {showAuthPrompt && !state.isAuthenticated ? (
              <GuestPrompt />
            ) : (
              <BlankQuizResults
                answers={answers}
                questions={quizData.questions}
                onRestart={restartQuiz}
                quizId={quizId}
                title={title || ""}
                slug={slug}
                onComplete={(score) => {
                  console.log("Quiz completed with score:", score)
                }}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
