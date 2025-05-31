"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { signIn } from "next-auth/react"
import { resetQuiz } from "@/store/slices/quizSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, RefreshCw, ChevronRight } from "lucide-react"
import { useSessionService } from "@/hooks/useSessionService"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import NonAuthenticatedUserSignInPrompt from "./NonAuthenticatedUserSignInPrompt"

// Import CodeQuizResult and MCQQuizResult
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
  hideAuthPrompt = false
}: QuizResultProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { clearQuizResults, saveAuthRedirectState } = useSessionService()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const handleRetake = useCallback(() => {
    if (onRetake) {
      // Use provided retake handler if available
      clearQuizResults()
      onRetake()
    } else if (result?.slug || slug) {
      // Otherwise navigate to the quiz
      clearQuizResults()
      router.push(`/dashboard/${quizType}/${result?.slug || slug}?reset=true`)
    }
  }, [onRetake, result?.slug, slug, quizType, router, clearQuizResults])

  const handleBrowseQuizzes = useCallback(() => {
    // Clear quiz state when navigating away
    clearQuizResults()
    router.push('/dashboard/quizzes')
  }, [router, clearQuizResults])
  
  const handleSignIn = useCallback(async () => {
    // Use external handler if provided
    if (externalSignInHandler) {
      return externalSignInHandler();
    }
    
    // Default sign-in behavior
    if (!slug && !result?.slug) {
      // Simple sign-in without state preservation
      await signIn();
      return;
    }
    
    // Build auth redirect state
    const safeSlug = slug || result?.slug;
    const returnPath = `/dashboard/${quizType}/${safeSlug}/results?fromAuth=true`;

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
    });
    
    await signIn(undefined, { callbackUrl: returnPath });
  }, [externalSignInHandler, slug, result, quizType, saveAuthRedirectState]);
  
  // If no result data, show empty state
  if (!result) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl border-0">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-3">No Results Available</h2>
          <p className="text-muted-foreground mb-8">
            We couldn't find any quiz results. Try taking a quiz first!
          </p>
          <Button onClick={handleBrowseQuizzes}>Browse Quizzes</Button>
        </CardContent>
      </Card>
    )
  }
  
  // Show authentication prompt for unauthenticated users
  if (!isAuthenticated && !hideAuthPrompt) {
    return (
      <div className="space-y-6">
        {/* Authentication Prompt */}
        <NonAuthenticatedUserSignInPrompt
          onSignIn={handleSignIn}
          previewData={result}
          title="Sign In to View Full Results"
          quizType={quizType}
          fallbackAction={{
            label: "Retake Quiz",
            onClick: handleRetake,
            variant: "outline"
          }}
        />
        
        {/* Blurred Preview of Results */}
        <div className="relative opacity-50 pointer-events-none select-none filter blur-sm">
          {/* Use the appropriate result component */}
          {quizType === "code" && <CodeQuizResult result={result} onRetake={handleRetake} />}
          {quizType === "mcq" && <MCQQuizResult result={result} />}
          {(quizType === "blanks" || quizType === "openended") && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">{result.title || "Quiz Results"}</h2>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <div className="text-5xl font-bold text-primary">{result.percentage}%</div>
                  <div className="text-xl text-muted-foreground">Score</div>
                </div>
                <p className="mt-2 text-muted-foreground">
                  You got {result.score} out of {result.maxScore} questions correct
                </p>
              </div>
            </div>
          )}
          
          {/* Overlay sign-in prompt */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/90 text-white px-6 py-3 rounded-lg shadow-lg">
              Sign in to view detailed results
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Delegate to the appropriate result component based on quiz type for authenticated users
  if (quizType === "code") {
    return <CodeQuizResult result={result} onRetake={handleRetake} />
  } else if (quizType === "mcq") {
    return <MCQQuizResult result={result} />
  }

  // Fallback generic result UI for other quiz types
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{result.title || "Quiz Results"}</h2>
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="text-5xl font-bold text-primary">{result.percentage}%</div>
          <div className="text-xl text-muted-foreground">Score</div>
        </div>
        <p className="mt-2 text-muted-foreground">
          You got {result.score} out of {result.maxScore} questions correct
        </p>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <Button onClick={handleRetake} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retake Quiz
        </Button>
        <Button onClick={handleBrowseQuizzes} className="gap-2">
          Browse Quizzes
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
