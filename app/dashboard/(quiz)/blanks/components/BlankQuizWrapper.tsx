"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import FillInTheBlanksQuiz from "./FillInTheBlanksQuiz"
import BlankQuizResults from "./BlankQuizResults"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { getSavedQuizState, clearSavedQuizState } from "@/hooks/quiz-session-storage"
import { QuizFeedback } from "../../components/QuizFeedback"
import { submitQuizResult } from "@/lib/quiz-result-service"

interface BlankQuizWrapperProps {
  quizData: any
  slug: string
}

export default function BlankQuizWrapper({ quizData, slug }: BlankQuizWrapperProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<
    { answer: string; timeSpent: number; hintsUsed: boolean; similarity?: number }[]
  >([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()
  const isLoggedIn = status === "authenticated"

  // Check for saved quiz state on mount
  useEffect(() => {
    if (typeof window !== "undefined" && status !== "loading") {
      const savedState = getSavedQuizState()

      // Check if savedState is null before destructuring
      if (savedState) {
        const { quizState, answers: savedAnswers } = savedState

        // If there's a saved state for this quiz, restore it
        if (quizState && quizState.quizId === quizData.id && quizState.quizType === "blanks") {
          setCurrentQuestion(quizState.currentQuestion)
          setStartTime(quizState.startTime)
          setIsCompleted(quizState.isCompleted)

          if (savedAnswers) {
            setAnswers(savedAnswers as { answer: string; timeSpent: number; hintsUsed: boolean; similarity?: number }[])
          }

          // Clear saved state
          clearSavedQuizState()

          // If quiz was completed, show results
          if (quizState.isCompleted) {
            setIsCompleted(true)
          }
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

  const completeQuiz = async (finalAnswers: typeof answers) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Calculate score based on similarity (this will be updated by BlankQuizResults)
      const score = 0 // Initial score, will be updated

      // If user is logged in, save to database
      if (isLoggedIn) {
        console.log("User is logged in, saving to database")
        await submitQuizResult({
          quizId: quizData.id,
          slug,
          answers: finalAnswers.map((a) => ({
            answer: a.answer,
            timeSpent: a.timeSpent,
            hintsUsed: a.hintsUsed,
            similarity: a.similarity,
          })),
          totalTime: (Date.now() - startTime) / 1000,
          score,
          type: "blanks",
          totalQuestions: quizData.questions.length,
        })
      } else {
        console.log("User is not logged in, not saving to database")
        // If user is not authenticated, show auth modal
        setShowAuthModal(true)
      }

      setQuizResults({ score })
      setIsSuccess(true)
      setIsCompleted(true)
      setShowFeedbackModal(true)
    } catch (err) {
      console.error("Error completing quiz:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setAnswers([])
    setIsCompleted(false)
    setStartTime(Date.now())
    setShowFeedbackModal(false)
    setQuizResults(null)
    setIsSubmitting(false)
    setIsSuccess(false)
    setError(null)

    // Force a refresh to ensure all components are reset
    router.refresh()
  }

  const handleComplete = (score: number, updatedAnswers: typeof answers) => {
    // Update answers with similarity scores
    setAnswers(updatedAnswers)

    // Update quiz results
    setQuizResults({ score })

    // If user is logged in, update the score in the database
    if (isLoggedIn) {
      submitQuizResult({
        quizId: quizData.id,
        slug,
        answers: updatedAnswers.map((a) => ({
          answer: a.answer,
          timeSpent: a.timeSpent,
          hintsUsed: a.hintsUsed,
          similarity: a.similarity,
        })),
        totalTime: (Date.now() - startTime) / 1000,
        score,
        type: "blanks",
        totalQuestions: quizData.questions.length,
      }).catch((err) => {
        console.error("Error updating quiz score:", err)
      })
    }
  }

  const handleFeedbackContinue = () => {
    setShowFeedbackModal(false)
  }

  return (
    <QuizAuthWrapper
      quizState={{
        quizId: quizData?.id,
        quizType: "blanks",
        quizSlug: slug,
        currentQuestion,
        totalQuestions: quizData?.questions?.length || 0,
        startTime,
        isCompleted,
      }}
      answers={answers}
      redirectPath={`/quiz/blanks/${slug}`}
      showAuthModal={showAuthModal}
      onAuthModalClose={() => setShowAuthModal(false)}
    >
      {isCompleted ? (
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
      ) : (
        <>
          <FillInTheBlanksQuiz
            question={quizData.questions[currentQuestion]}
            onAnswer={handleAnswer}
            questionNumber={currentQuestion + 1}
            totalQuestions={quizData.questions.length}
          />
          {showFeedbackModal && (
            <QuizFeedback
              isSubmitting={isSubmitting}
              isSuccess={isSuccess}
              isError={!!error}
              score={quizResults?.score || 0}
              totalQuestions={100} // Use 100 for percentage display
              onContinue={handleFeedbackContinue}
              errorMessage={error || undefined}
              quizType="blanks"
              waitForSave={true}
              autoClose={false}
            />
          )}
        </>
      )}
    </QuizAuthWrapper>
  )
}
