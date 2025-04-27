"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { LogIn, Save, UserPlus, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuiz } from "@/app/context/QuizContext"
import { useAuth } from "@/providers/unified-auth-provider"
import { quizService } from "@/lib/QuizService"

export function GuestPrompt(props: { quizId?: string; forceShow?: boolean }) {
  const { state, completeQuiz, onAuthRequired } = useQuiz()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [shouldShow, setShouldShow] = useState(props.forceShow || false)
  const [isLoading, setIsLoading] = useState(false)
  const checkDone = useRef(false)

  useEffect(() => {
    // If forceShow is true, always show
    if (props.forceShow) {
      setShouldShow(true)
      return
    }

    // Only run this check once
    if (checkDone.current) return
    checkDone.current = true

    // Check if we should show the guest sign-in prompt
    if (typeof window !== "undefined") {
      // Get quizId from props or context
      const quizId = props.quizId || state.quizId || ""

      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const isCompleted = urlParams.get("completed") === "true"
      const isReturningFromAuth = urlParams.get("fromAuth") === "true"

      // Never show if authenticated
      if (isAuthenticated) {
        console.log("User is authenticated, not showing guest prompt")
        setShouldShow(false)
        return
      }

      // Never show if URL has completed=true or returning from auth
      if (isCompleted || isReturningFromAuth) {
        console.log("URL has completed=true or fromAuth=true, not showing guest prompt")
        setShouldShow(false)
        return
      }

      // For non-authenticated users, show the prompt
      if (!isAuthenticated) {
        console.log("User is not authenticated, showing guest prompt")
        setShouldShow(true)
      }
    }
  }, [isAuthenticated, props.quizId, state.quizId, state.isCompleted, props.forceShow])

  // Always show if forceShow is true
  useEffect(() => {
    if (props.forceShow) {
      setShouldShow(true)
    }
  }, [props.forceShow])

  if (!shouldShow) return null

  // Handle sign in
  const handleSignIn = () => {
    setIsLoading(true)

    // Save current answers to be used after authentication
    const currentAnswers = [...state.answers]

    // Generate the redirect URL - this should point back to the quiz with completed=true
    const redirectUrl = `/dashboard/${state.quizType}/${state.slug}?completed=true&fromAuth=true`

    // Save current quiz state for retrieval after auth with more details
    quizService.savePendingQuizData({
      quizId: state.quizId,
      slug: state.slug,
      type: state.quizType,
      score: state.score,
      totalTime: state.timeSpentPerQuestion.reduce((a, b) => a + b, 0),
      totalQuestions: state.questionCount,
      answers: currentAnswers,
      isCompleted: true,
      timestamp: Date.now(),
    })

    // Use the onAuthRequired callback from the context
    if (onAuthRequired) {
      // Pass the redirect URL to the auth handler
      onAuthRequired(redirectUrl)
    } else {
      // Fallback - redirect to sign in page with the callback URL
      window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`
    }
  }

  // Handle continue as guest
  const handleContinueAsGuest = () => {
    setIsLoading(true)
    // Complete the quiz without authentication
    setTimeout(() => {
      completeQuiz(state.answers.filter((a) => a !== null))
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Save Your Progress</CardTitle>
        <CardDescription>Sign in to save your quiz results and track your progress over time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Save className="h-4 w-4 text-primary" />
            <span>Save quiz results to your account</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-primary" />
            <span>Access your results from any device</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Choose an option</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button className="w-full gap-2" onClick={handleSignIn} disabled={isLoading}>
          <LogIn className="h-4 w-4" />
          Sign In to Save Results
        </Button>
        <Button variant="outline" className="w-full gap-2" onClick={handleContinueAsGuest} disabled={isLoading}>
          <UserPlus className="h-4 w-4" />
          Continue as Guest
        </Button>
      </CardFooter>
    </Card>
  )
}
