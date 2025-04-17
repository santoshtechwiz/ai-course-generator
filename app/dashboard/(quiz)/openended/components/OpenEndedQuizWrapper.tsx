"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import QuizResultsOpenEnded from "./QuizResultsOpenEnded"
import QuizAuthWrapper from "../../components/QuizAuthWrapper"
import { getSavedQuizState, clearSavedQuizState } from "@/hooks/quiz-session-storage"
import { QuizFeedback } from "../../components/QuizFeedback"
import { submitQuizResult } from "@/lib/quiz-result-service"

interface OpenEndedQuizWrapperProps {
  quizData: any
  slug: string
}

export default function OpenEndedQuizWrapper({ quizData, slug }: OpenEndedQuizWrapperProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ answer: string; timeSpent: number; hintsUsed: boolean }[]>([])
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

  // Ref to track if we've already saved to the database
  const hasSavedToDb = useRef(false)

  // Debug logging
  useEffect(() => {
    console.log("Current question:", currentQuestion)
    console.log("Total questions:", quizData?.questions?.length)
    console.log("Is completed:", isCompleted)
    console.log("Show feedback modal:", showFeedbackModal)
    console.log("Quiz results:", quizResults)
  }, [currentQuestion, quizData?.questions?.length, isCompleted, showFeedbackModal, quizResults])

  // Check for saved quiz state on mount
  useEffect(() => {
    if (typeof window !== "undefined" && status !== "loading") {
      const savedState = getSavedQuizState()

      // Check if savedState is null before destructuring
      if (savedState) {
        const { quizState, answers: savedAnswers } = savedState

        // If there's a saved state for this quiz, restore it
        if (quizState && quizState.quizId === quizData.id && quizState.quizType === "openended") {
          setCurrentQuestion(quizState.currentQuestion)
          setStartTime(quizState.startTime)
          setIsCompleted(quizState.isCompleted)

          if (savedAnswers) {
            setAnswers(savedAnswers as { answer: string; timeSpent: number; hintsUsed: boolean }[])
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

  const handleAnswer = (answer: string) => {
    console.log("Answer received:", answer)
    console.log("Current question:", currentQuestion)
    console.log("Total questions:", quizData?.questions?.length)

    // Calculate time spent on this question
    const timeSpent = (Date.now() - startTime) / 1000
    const hintsUsed = false // You can implement hint tracking if needed

    // Create a new answers array with the current answer
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = { answer, timeSpent, hintsUsed }
    setAnswers(newAnswers)

    // Check if this is the last question
    if (currentQuestion < quizData.questions.length - 1) {
      // Move to the next question
      setCurrentQuestion(currentQuestion + 1)
      // Reset the start time for the next question
      setStartTime(Date.now())
    } else {
      // This is the last question, complete the quiz
      console.log("Last question answered, completing quiz")
      completeQuiz(newAnswers)
    }
  }

  // Calculate a score for open-ended questions based on answer quality
  const calculateOpenEndedScore = (finalAnswers: typeof answers): number => {
    // For open-ended quizzes, we'll evaluate answers based on length and content
    // This is a simple implementation - you can make it more sophisticated

    if (!finalAnswers.length || !quizData.questions.length) return 0

    let totalScore = 0

    finalAnswers.forEach((answer, index) => {
      const question = quizData.questions[index]
      if (!question || !answer.answer) return

      // Base score: 70% just for answering
      let questionScore = 70

      // Add up to 30% based on answer length (minimum 20 chars for full points)
      const answerLength = answer.answer.trim().length
      const lengthScore = Math.min(30, Math.round((answerLength / 20) * 30))

      // Combine scores
      questionScore += lengthScore

      // Cap at 100%
      questionScore = Math.min(100, questionScore)

      totalScore += questionScore
    })

    // Calculate average score across all questions
    return Math.round(totalScore / quizData.questions.length)
  }

  const completeQuiz = async (finalAnswers: typeof answers) => {
    console.log("Completing quiz with answers:", finalAnswers)
    setIsSubmitting(true)
    setError(null)
    hasSavedToDb.current = false

    try {
      // Calculate a score for open-ended questions
      const score = calculateOpenEndedScore(finalAnswers)
      console.log("Calculated score:", score)

      // Save to session storage
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `quiz_result_${quizData.id}`,
          JSON.stringify({
            answers: finalAnswers,
            score,
            totalTime: (Date.now() - startTime) / 1000,
            timestamp: Date.now(),
            isCompleted: true,
          }),
        )
      }

      // IMPORTANT: Show feedback modal BEFORE saving to database
      // This ensures the modal appears immediately
      setQuizResults({ score })
      setIsSuccess(true)
      setShowFeedbackModal(true)

      // If user is logged in, save to database
      if (isLoggedIn) {
        console.log("User is logged in, saving to database")
        try {
          const result = await submitQuizResult({
            quizId: quizData.id,
            slug,
            answers: finalAnswers.map((a) => ({
              answer: a.answer,
              timeSpent: a.timeSpent,
              hintsUsed: a.hintsUsed,
            })),
            totalTime: (Date.now() - startTime) / 1000,
            score,
            type: "openended",
            totalQuestions: quizData.questions.length,
          })
          console.log("Database save result:", result)
          hasSavedToDb.current = true
        } catch (dbError) {
          console.error("Error saving to database:", dbError)
          // Don't set error state here, as we still want to show success feedback
          // Just log the error
        }
      } else {
        console.log("User is not logged in, not saving to database")
        // If user is not authenticated, show auth modal
        setShowAuthModal(true)
      }

      console.log("Quiz completed, feedback modal should show")
    } catch (err) {
      console.error("Error completing quiz:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsSuccess(false)
      // Still show feedback modal with error
      setShowFeedbackModal(true)
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
    hasSavedToDb.current = false

    // Clear session storage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`quiz_result_${quizData.id}`)
    }

    // Force a refresh to ensure all components are reset
    router.refresh()
  }

  const handleComplete = (score: number) => {
    // This function is called when the quiz results are calculated
    setQuizResults({ score })
  }

  const handleFeedbackContinue = (proceed: boolean) => {
    console.log("Feedback continue clicked, proceed:", proceed)
    setShowFeedbackModal(false)

    if (proceed) {
      // Only set isCompleted to true when the user clicks "View Results"
      setIsCompleted(true)
    }
  }

  return (
    <QuizAuthWrapper
      quizState={{
        quizId: quizData?.id,
        quizType: "openended",
        quizSlug: slug,
        currentQuestion,
        totalQuestions: quizData?.questions?.length || 0,
        startTime,
        isCompleted,
      }}
      answers={answers}
      redirectPath={`/quiz/openended/${slug}`}
      showAuthModal={showAuthModal}
      onAuthModalClose={() => setShowAuthModal(false)}
    >
      {isCompleted ? (
        <QuizResultsOpenEnded
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
          <OpenEndedQuizQuestion
            question={quizData.questions[currentQuestion]}
            onAnswer={handleAnswer}
            questionNumber={currentQuestion + 1}
            totalQuestions={quizData.questions.length}
          />
        </>
      )}

      {/* Render feedback modal outside the conditional rendering to ensure it's always available */}
      {showFeedbackModal && (
        <QuizFeedback
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
          isError={!!error}
          score={quizResults?.score || 0}
          totalQuestions={100} // Use 100 for percentage display
          onContinue={handleFeedbackContinue}
          errorMessage={error || undefined}
          quizType="openended"
          waitForSave={true}
          autoClose={false}
        />
      )}
    </QuizAuthWrapper>
  )
}
