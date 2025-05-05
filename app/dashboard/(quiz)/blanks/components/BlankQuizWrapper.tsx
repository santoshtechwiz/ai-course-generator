"use client"
import { useRouter } from "next/navigation"
import { AlertCircle, LogIn, Info, Loader2 } from "lucide-react"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import BlankQuizResults from "./BlankQuizResults"
import FillInTheBlanksQuiz from "./FillInTheBlanksQuiz"
import { useToast } from "@/hooks/use-toast"
import { createSafeQuizData, validateInitialQuizData } from "@/lib/utils/quiz-state-utils"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"

import {
  initQuiz,
  submitAnswer,
  completeQuiz,
  resetQuiz,
  saveStateBeforeAuth,
  setRequiresAuth,
  setPendingAuthRequired,
} from "@/store/slices/quizSlice"
import { setIsProcessingAuth, setRedirectUrl } from "@/store/slices/authSlice"
import { Progress } from "@/components/ui/progress"
import { useAppDispatch, useAppSelector } from "@/store"

interface BlankQuizWrapperProps {
  quizData: any
  slug: string
}

// This is the main wrapper that uses Redux
export default function BlankQuizWrapper({ quizData, slug }: BlankQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [startTime] = useState<number>(Date.now())

  // Get auth state from Redux
  const authState = useAppSelector((state) => state.auth)
  const isAuthenticated = authState.isAuthenticated

  // Validate quiz data
  const validationResult = validateInitialQuizData(quizData)
  if (!validationResult.isValid) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading quiz</AlertTitle>
        <AlertDescription>
          <p className="mb-4">{validationResult.error}</p>
          <Button onClick={() => router.push("/dashboard/blanks")} variant="default">
            Return to Quiz Creator
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Create a safe quiz data object
  const safeQuizData = createSafeQuizData(quizData, slug, "blanks")

  // Initialize quiz with Redux
  useEffect(() => {
    dispatch(
      initQuiz({
        quizId: safeQuizData.id || safeQuizData.quizId || "unknown",
        slug: slug || "unknown",
        title: safeQuizData.title || "Fill in the Blanks Quiz",
        quizType: "blanks",
        questions: safeQuizData.questions || [],
        isCompleted: false,
        score: 0,
        requiresAuth: false,
      }),
    )
  }, [safeQuizData, slug, dispatch])

  return <BlankQuizContent quizData={safeQuizData} slug={slug || "unknown"} />
}

// Update the BlankQuizContent component to use Redux
function BlankQuizContent({ quizData, slug }: { quizData: any; slug: string }) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [startTime] = useState<number>(Date.now())

  // Get auth state from Redux
  const authState = useAppSelector((state) => state.auth)
  const isAuthenticated = authState.isAuthenticated

  // Get quiz state from Redux
  const quizState = useAppSelector((state) => state.quiz)

  // Local UI state
  const [displayState, setDisplayState] = useState<"quiz" | "results" | "auth" | "loading">("loading")
  const [fromAuth, setFromAuth] = useState(false)
  const [hasCheckedAuthReturn, setHasCheckedAuthReturn] = useState(false)

  // Check URL parameters for auth return
  useEffect(() => {
    if (typeof window !== "undefined" && !hasCheckedAuthReturn) {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuthParam = urlParams.get("fromAuth") === "true"
      setFromAuth(fromAuthParam)

      if (fromAuthParam && isAuthenticated) {
        // If returning from auth and authenticated, show results
        setDisplayState("results")

        // Clear the fromAuth parameter
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete("fromAuth")
        window.history.replaceState({}, "", newUrl.toString())
      } else if (displayState === "loading") {
        // Set display state to quiz after initialization
        setDisplayState("quiz")
      }

      setHasCheckedAuthReturn(true)
    }
  }, [isAuthenticated, hasCheckedAuthReturn, displayState])

  // Update display state based on quiz state
  useEffect(() => {
    if (quizState.isSavingResults) {
      setDisplayState("loading")
      return
    }

    if (quizState.isCompleted) {
      if (isAuthenticated) {
        setDisplayState("results")
      } else {
        setDisplayState("auth")
      }
      return
    }

    if (displayState === "loading" && !quizState.isSavingResults && hasCheckedAuthReturn) {
      setDisplayState("quiz")
    }
  }, [quizState.isCompleted, quizState.isSavingResults, isAuthenticated, displayState, hasCheckedAuthReturn])

  // Handle answer submission
  const handleAnswer = (answer: string, timeSpent: number, hintsUsed: boolean, similarity?: number) => {
    // Calculate if the answer is correct based on similarity
    const isCorrect = similarity ? similarity > 80 : false

    // Submit answer to Redux
    dispatch(
      submitAnswer({
        answer,
        userAnswer: answer,
        timeSpent,
        isCorrect,
        hintsUsed,
        similarity,
      }),
    )

    // If this is the last question, complete the quiz
    if (quizState.currentQuestionIndex >= quizState.questions.length - 1) {
      // Calculate score based on similarity
      const allAnswers = [...quizState.answers, { answer, timeSpent, isCorrect, hintsUsed, similarity }].filter(Boolean)
      const score = calculateScore(allAnswers)

      // Complete the quiz
      setTimeout(() => {
        dispatch(
          completeQuiz({
            answers: allAnswers,
            score,
            completedAt: new Date().toISOString(),
          }),
        )
      }, 800)
    }
  }

  // Helper function to calculate score
  const calculateScore = (answers: any[]) => {
    if (!answers.length) return 0
    const correctAnswers = answers.filter((a) => a.isCorrect).length
    return Math.round((correctAnswers / answers.length) * 100)
  }

  // Handle restart quiz
  const handleRestartQuiz = () => {
    dispatch(resetQuiz())
    setDisplayState("quiz")

    toast({
      title: "Quiz restarted",
      description: "You can now retake the quiz. Sign in to save your results.",
      variant: "default",
    })
  }

  // Handle sign in
  const handleSignIn = () => {
    // Create the redirect URL
    const redirectUrl = `/dashboard/blanks/${slug}?fromAuth=true`

    // Save current state before auth
    dispatch(
      saveStateBeforeAuth({
        quizId: quizState.quizId,
        slug,
        quizType: "blanks",
        currentQuestionIndex: quizState.currentQuestionIndex,
        answers: quizState.answers,
        isCompleted: true,
        score: quizState.score,
        completedAt: new Date().toISOString(),
      }),
    )

    // Set auth flags
    dispatch(setRequiresAuth(true))
    dispatch(setPendingAuthRequired(true))
    dispatch(setIsProcessingAuth(true))
    dispatch(setRedirectUrl(redirectUrl))

    // Redirect to sign-in
    router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`)
  }

  // Handle continue as guest
  const handleContinueAsGuest = () => {
    setDisplayState("results")
  }

  // Error state
  if (quizState.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading quiz</AlertTitle>
        <AlertDescription>
          <p className="mb-4">{quizState.error}</p>
          <Button onClick={() => router.push("/dashboard/blanks")} variant="default">
            Return to Quiz Creator
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Loading state
  if (displayState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-center text-muted-foreground">Loading quiz...</p>
        <Progress value={30} className="w-full max-w-md mx-auto mt-2" />
      </div>
    )
  }

  // Auth prompt
  if (displayState === "auth") {
    return (
      <NonAuthenticatedUserSignInPrompt
        onSignIn={handleSignIn}
        onContinueAsGuest={handleContinueAsGuest}
        quizType="fill-in-the-blanks quiz"
      />
    )
  }

  // Results
  if (displayState === "results") {
    return (
      <div className="p-4 bg-card rounded-lg shadow-sm border">
        {!isAuthenticated && (
          <div className="mb-4 p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-300">Guest Mode</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  You're viewing results as a guest. Your progress won't be saved when you leave this page.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white border-none"
                    onClick={handleSignIn}
                  >
                    <LogIn className="h-3.5 w-3.5 mr-1.5" />
                    Sign in to save results
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    onClick={() => {
                      toast({
                        title: "Guest Mode Information",
                        description:
                          "In guest mode, you can view your results but they won't be saved to your account or be available after you leave this page.",
                        variant: "default",
                      })
                    }}
                  >
                    <Info className="h-3.5 w-3.5 mr-1.5" />
                    Learn more
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        <BlankQuizResults
          answers={quizState.answers.filter(Boolean)}
          questions={quizData?.questions || []}
          onRestart={handleRestartQuiz}
          quizId={quizState.quizId || "unknown"}
          title={quizState.title || ""}
          slug={slug || "unknown"}
          onComplete={() => {}}
        />
      </div>
    )
  }

  // Quiz
  const currentQuestionData = quizData?.questions?.[quizState.currentQuestionIndex] || null
  const totalQuestions = quizData?.questions?.length || 0
  const currentQuestionIndex = quizState.currentQuestionIndex

  // Calculate progress percentage safely
  const progressPercentage = totalQuestions > 0 ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100) : 0

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Quiz Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span>{progressPercentage}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {currentQuestionData && (
        <FillInTheBlanksQuiz
          question={currentQuestionData}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
        />
      )}
    </div>
  )
}
