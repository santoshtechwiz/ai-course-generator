"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import BlankQuizResults from "./BlankQuizResults"
import { getSavedQuizState, clearSavedQuizState } from "@/hooks/quiz-session-storage"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { FillInTheBlanksQuiz } from "./FillInTheBlanksQuiz"

interface BlankQuizWrapperProps {
  quizData: any
  slug: string
}

export default function BlankQuizWrapper({ quizData, slug }: BlankQuizWrapperProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ answer: string; timeSpent: number; hintsUsed: boolean }[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Check for saved quiz state on mount
  useEffect(() => {
    if (typeof window !== "undefined" && status !== "loading") {
      const { quizState, answers: savedAnswers } = getSavedQuizState()

      // If there's a saved state for this quiz, restore it
      if (quizState && quizState.quizId === quizData.id && quizState.quizType === "blanks") {
        setCurrentQuestion(quizState.currentQuestion)
        setStartTime(quizState.startTime)
        setIsCompleted(quizState.isCompleted)

        if (savedAnswers) {
          setAnswers(savedAnswers)
        }

        // Clear saved state
        clearSavedQuizState()

        // If quiz was completed, show results
        if (quizState.isCompleted) {
          setIsCompleted(true)
        }
      }
    }
  }, [quizData?.id, status])

  const handleAnswer = (answer: string, timeSpent: number, hintsUsed: boolean) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = { answer, timeSpent, hintsUsed }
    setAnswers(newAnswers)

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      completeQuiz(newAnswers)
    }
  }

  const completeQuiz = (finalAnswers: typeof answers) => {
    // If user is not authenticated, show auth modal
    if (!session) {
      const quizState = {
        quizId: quizData.id,
        quizType: "blanks",
        quizSlug: slug,
        currentQuestion,
        totalQuestions: quizData.questions.length,
        startTime,
        isCompleted: true,
      }

      const redirectPath = `/quiz/blanks/${slug}/results`

      setShowAuthModal(true)
      setAnswers(finalAnswers)
      setIsCompleted(true)
      return
    }

    // Otherwise, complete the quiz
    setIsCompleted(true)
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setAnswers([])
    setIsCompleted(false)
    setStartTime(Date.now())
  }

  const handleComplete = (score: number) => {
    // This function is called when the quiz results are calculated
    // You can use it to update UI or trigger other actions
  }

  if (!quizData || !quizData.questions) {
    return (
      <div className="text-center p-4">
        <h2 className="text-xl font-bold">Quiz data is not available</h2>
        <p>Please try reloading the page or contact support if the issue persists.</p>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <BlankQuizResults
        answers={answers}
        questions={quizData.questions}
        onRestart={handleRestart}
        onComplete={handleComplete}
        quizId={quizData.id}
        title={quizData.title}
        slug={slug}
        clearGuestData={clearSavedQuizState}
      />
    )
  }

  return (
    <QuizAuthWrapper
      quizState={{
        quizId: quizData?.id,
        quizType: "blanks",
        quizSlug: slug,
        currentQuestion,
        totalQuestions: quizData?.questions?.length || 0, // Add fallback for undefined
        startTime,
        isCompleted,
      }}
      answers={answers}
      redirectPath={`/quiz/blanks/${slug}`}
      showAuthModal={showAuthModal}
      onAuthModalClose={() => setShowAuthModal(false)}
    >
      {quizData.questions && ( // Ensure questions exist before rendering
        <FillInTheBlanksQuiz
          question={quizData.questions[currentQuestion]}
          onAnswer={handleAnswer}
          questionNumber={currentQuestion + 1}
          totalQuestions={quizData.questions.length}
        />
      )}
    </QuizAuthWrapper>
  )
}
