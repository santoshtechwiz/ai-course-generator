"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "react-hot-toast"

import { useQuiz } from "@/hooks/useQuizState"
import { InitializingDisplay, EmptyQuestionsDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import { QuizSubmissionLoading } from "../../components/QuizSubmissionLoading"
import CodingQuiz from "./CodingQuiz"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"

interface CodeQuizWrapperProps {
  slug: string
  quizId: string
  userId: string | null
  quizData?: any
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

export default function CodeQuizWrapper({
  slug,
  quizId,
  userId,
  quizData,
  isPublic,
  isFavorite,
  ownerId,
}: CodeQuizWrapperProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [authChecked, setAuthChecked] = useState(true) // Changed to default true to allow non-auth users
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResultsLoader, setShowResultsLoader] = useState(false)
  const [needsSignIn, setNeedsSignIn] = useState(false)

  const {
    quizData: quizState,
    currentQuestion,
    isCompleted,
    error,
    isLoading,
    loadQuiz,
    saveAnswer,
    submitQuiz,
    nextQuestion,
    resetQuizState,
  } = useQuiz()

  useEffect(() => {
    if (status === "unauthenticated") {
      // Store path for redirection after auth, but continue with the quiz
      sessionStorage.setItem("quizRedirectPath", window.location.pathname)
    }
  }, [status])

  useEffect(() => {
    // Always attempt to load the quiz, regardless of auth status
    if (!quizState && !isLoading && !error) {
      if (quizData && Array.isArray(quizData?.questions)) {
        loadQuiz(slug, "code", {
          id: quizId,
          title: quizData.title,
          slug,
          type: "code",
          questions: quizData.questions,
          isPublic: isPublic ?? false,
          isFavorite: isFavorite ?? false,
          ownerId: ownerId ?? "",
          timeLimit: quizData.timeLimit ?? null,
        })
      }
    }
  }, [slug, quizId, quizData, isPublic, isFavorite, ownerId, quizState, isLoading, error, loadQuiz])

  useEffect(() => {
    return () => {
      if (!window.location.pathname.includes(`/dashboard/code/${slug}`)) {
        resetQuizState()
      }
    }
  }, [resetQuizState, slug])

  const questions = quizState?.questions || []
  const totalQuestions = questions.length
  const currentQuestionData = questions[currentQuestion] || null
  const isLastQuestion = currentQuestion === totalQuestions - 1

  const handleAnswer = useCallback(
    async (answer: string, elapsedTime: number, isCorrect: boolean) => {
      try {
        const question = questions[currentQuestion]
        if (!question?.id) {
          setErrorMessage("Invalid question data")
          return
        }

        // Save the answer to Redux state
        await saveAnswer(question.id, answer)

        if (isLastQuestion) {
          // Save quiz submission in progress status
          const key = `quiz-submission-${slug}`
          localStorage.setItem(key, "in-progress")
          setIsSubmitting(true)
          setShowResultsLoader(true)
          
          try {
            // Try up to 3 times to submit the quiz
            let result = null;
            let attempts = 0;
            let error = null;
            
            while (attempts < 3 && !result) {
              try {
                attempts++;
                if (attempts > 1) {
                  console.log(`Attempt ${attempts} to submit quiz...`);
                }
                
                // Submit the quiz
                result = await submitQuiz(slug);
              } catch (err) {
                error = err;
                // Wait a bit before retrying
                if (attempts < 3) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            }
            
            if (!result) {
              throw error || new Error("Failed to submit quiz after multiple attempts");
            }
            
            console.log("Quiz submission successful:", result)
            
            // Check authentication status to determine next steps
            if (userId) {
              // Short delay for better UX
              setTimeout(() => {
                // Use replace instead of push to prevent back navigation to the quiz
                router.replace(`/dashboard/code/${slug}/results`)
              }, 1500)
            } else {
              // Non-authenticated user: show sign-in prompt
              setNeedsSignIn(true)
              setTimeout(() => {
                setShowResultsLoader(false)
              }, 1000)
            }
          } catch (error) {
            console.error("Error submitting quiz in handleAnswer:", error)
            
            // Handle the error more gracefully
            setShowResultsLoader(false)
            setIsSubmitting(false)
            
            // Show error with retry option
            setErrorMessage("Failed to submit quiz. Please try again.")
            localStorage.removeItem(key)
          }
        } else {
          // Move to next question if not the last
          nextQuestion()
        }
      } catch (err) {
        console.error("Error handling answer:", err)
        setErrorMessage("Failed to submit answer")
      }
    },
    [questions, currentQuestion, saveAnswer, submitQuiz, slug, isLastQuestion, nextQuestion, userId, router]
  )

  // Add a retry submission handler
  const handleRetrySubmission = useCallback(async () => {
    if (!quizState || questions.length === 0) {
      setErrorMessage("Quiz data is missing. Please reload the page.")
      return
    }
    
    setErrorMessage(null)
    setIsSubmitting(true)
    setShowResultsLoader(true)
    
    try {
      // Try to submit one more time
      const result = await submitQuiz(slug)
      
      if (result) {
        console.log("Quiz submission successful on retry:", result)
        
        if (userId) {
          setTimeout(() => {
            router.replace(`/dashboard/code/${slug}/results`)
          }, 1000)
        } else {
          setNeedsSignIn(true)
          setTimeout(() => {
            setShowResultsLoader(false)
          }, 1000)
        }
      } else {
        throw new Error("No result returned from submission")
      }
    } catch (error) {
      console.error("Error during submission retry:", error)
      setShowResultsLoader(false)
      setIsSubmitting(false)
      setErrorMessage("Still unable to submit quiz. Please try again later.")
    }
  }, [quizState, questions, submitQuiz, slug, userId, router])

  const handleReturn = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  const handleRetry = useCallback(() => {
    if (!userId || session?.status !== "authenticated") {
      const returnUrl = `/dashboard/code/${slug}`
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}`)
    } else {
      window.location.reload()
    }
  }, [userId, slug, router, session?.status])

  const handleSignIn = useCallback(() => {
    sessionStorage.setItem("quizRedirectPath", `/dashboard/code/${slug}/results`)
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/code/${slug}/results`)}`)
  }, [router, slug])

  if (isLoading || status === "loading") {
    return <InitializingDisplay />
  }

  if (error || errorMessage) {
    return (
      <ErrorDisplay
        error={errorMessage || error || "An error occurred"}
        onRetry={errorMessage === "Failed to submit quiz. Please try again." ? handleRetrySubmission : handleRetry}
        onReturn={handleReturn}
      />
    )
  }

  if (!questions.length) {
    return <EmptyQuestionsDisplay onReturn={handleReturn} />
  }

  // Show the loading screen while submitting the quiz
  if (showResultsLoader) {
    return <QuizSubmissionLoading quizType="code" />
  }

  // Only show sign-in prompt when needed
  if (needsSignIn || (isCompleted && !userId)) {
    return <NonAuthenticatedUserSignInPrompt quizType="code" onSignIn={handleSignIn} showSaveMessage />
  }

  // Show current question if available
  if (currentQuestionData) {
    return (
      <CodingQuiz
        question={currentQuestionData}
        onAnswer={handleAnswer}
        questionNumber={currentQuestion + 1}
        totalQuestions={totalQuestions}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
      />
    )
  }

  return <InitializingDisplay />
}
