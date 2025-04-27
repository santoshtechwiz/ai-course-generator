"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { quizService } from "@/lib/quiz-service"

interface GuestPromptProps {
  quizId: string
  forceShow?: boolean
  onContinueAsGuest?: () => void
}

export function GuestPrompt({ quizId, forceShow = false, onContinueAsGuest }: GuestPromptProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Don't show if already dismissed
  if (dismissed && !forceShow) {
    return null
  }

  const handleSignIn = () => {
    setIsRedirecting(true)

    // Get the current URL to redirect back after sign in
    const currentUrl = window.location.href

    // Use QuizService to handle auth redirect
    quizService.handleAuthRedirect(currentUrl)
  }

  const handleContinueAsGuest = () => {
    // Mark as dismissed
    setDismissed(true)

    // Call the callback if provided
    if (onContinueAsGuest) {
      onContinueAsGuest()
    }

    // Just close the prompt
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto my-8"
    >
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Save Your Progress</CardTitle>
          <CardDescription>Sign in to save your quiz results and track your progress over time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Track your progress across all quizzes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Access your quiz history anytime</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Get personalized learning recommendations</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={handleSignIn} disabled={isRedirecting}>
            {isRedirecting ? (
              <>
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                Redirecting...
              </>
            ) : (
              "Sign In to Save Results"
            )}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleContinueAsGuest}>
            Continue as Guest
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
