"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, ChevronRight, Trophy } from "lucide-react"
import { useSessionService } from "@/hooks/useSessionService"
import { useSelector } from "react-redux"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import NonAuthenticatedUserSignInPrompt from "./NonAuthenticatedUserSignInPrompt"
import CodeQuizResult from "../code/components/CodeQuizResult"
import MCQQuizResult from "../mcq/components/McqQuizResult"

interface QuizResultProps {
  result: any
  onRetake?: () => void
  quizType: "code" | "mcq" | "blanks" | "openended"
  slug?: string
  onSignIn?: () => void
  hideAuthPrompt?: boolean
}

export default function QuizResult({
  result,
  onRetake,
  quizType,
  slug,
  onSignIn: externalSignInHandler,
  hideAuthPrompt = false,
}: QuizResultProps) {
  const router = useRouter()
  const { clearQuizResults, saveAuthRedirectState } = useSessionService()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const handleRetake = useCallback(() => {
    if (onRetake) {
      clearQuizResults()
      onRetake()
    } else if (result?.slug || slug) {
      clearQuizResults()
      router.push(`/dashboard/${quizType}/${result?.slug || slug}?reset=true`)
    }
  }, [onRetake, result?.slug, slug, quizType, router, clearQuizResults])

  const handleBrowseQuizzes = useCallback(() => {
    clearQuizResults()
    router.push("/dashboard/quizzes")
  }, [router, clearQuizResults])

  const handleSignIn = useCallback(async () => {
    if (externalSignInHandler) {
      return externalSignInHandler()
    }

    if (!slug && !result?.slug) {
      await signIn()
      return
    }

    const safeSlug = slug || result?.slug
    const returnPath = `/dashboard/${quizType}/${safeSlug}/results?fromAuth=true`

    saveAuthRedirectState({
      returnPath,
      quizState: {
        slug: safeSlug,
        quizData: result?.quizData,
        currentState: {
          answers: result?.answers || {},
          showResults: true,
          results: result,
        },
      },
    })

    await signIn(undefined, { callbackUrl: returnPath })
  }, [externalSignInHandler, slug, result, quizType, saveAuthRedirectState])

  // No result state
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center">
          <Trophy className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">No Results Available</h2>
          <p className="text-muted-foreground max-w-md">We couldn't find any quiz results. Try taking a quiz first!</p>
        </div>
        <Button onClick={handleBrowseQuizzes} className="gap-2">
          Browse Quizzes
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // Authentication prompt for unauthenticated users
  if (!isAuthenticated && !hideAuthPrompt) {
    return (
      <div className="space-y-6">
        <NonAuthenticatedUserSignInPrompt
          onSignIn={handleSignIn}
          previewData={result}
          title="Sign In to View Full Results"
          quizType={quizType}
          fallbackAction={{
            label: "Retake Quiz",
            onClick: handleRetake,
            variant: "outline",
          }}
        />

        {/* Blurred preview */}
        <div className="relative opacity-50 pointer-events-none select-none filter blur-sm">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{result.title || "Quiz Results"}</h2>
                <div className="text-4xl font-bold text-primary">{result.percentage || 0}%</div>
                <p className="text-muted-foreground">
                  You got {result.score || 0} out of {result.maxScore || 0} questions correct
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/90 text-white px-6 py-3 rounded-lg shadow-lg">
              Sign in to view detailed results
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Delegate to specific result components for authenticated users
  if (quizType === "code") {
    return <CodeQuizResult result={result} onRetake={handleRetake} />
  } else if (quizType === "mcq") {
    return <MCQQuizResult result={result} />
  }

  // Fallback for other quiz types
  return (
    <Card>
      <CardContent className="p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{result.title || "Quiz Results"}</h2>
          <div className="text-4xl font-bold text-primary">{result.percentage}%</div>
          <p className="text-muted-foreground">
            You got {result.score} out of {result.maxScore} questions correct
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={handleRetake} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Retake Quiz
          </Button>
          <Button onClick={handleBrowseQuizzes} className="gap-2">
            Browse Quizzes
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
