"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn, ArrowLeft, Shield, Clock, Save } from "lucide-react"
import { useAuth } from "@/providers/unified-auth-provider"
import { quizService } from "@/lib/quiz-service"

interface GuestSignInPromptProps {
  title?: string
  description?: string
  ctaText?: string
  allowContinue?: boolean
  onContinueAsGuest?: () => void
  onSignIn: () => void
  onClearData?: () => void
  showClearDataButton?: boolean
  forceShow?: boolean
  quizId?: string
  redirectUrl?: string
}

export function GuestSignInPrompt({
  title = "Sign in to continue",
  description = "Sign in to save your progress and access all features.",
  ctaText = "Sign in to continue",
  allowContinue = false,
  onContinueAsGuest,
  onSignIn,
  onClearData,
  showClearDataButton = false,
  forceShow = false,
  quizId,
  redirectUrl,
}: GuestSignInPromptProps) {
  const { isAuthenticated, user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // If user is authenticated and this isn't forced, don't show
  if (isAuthenticated && !forceShow) {
    return null
  }

  const handleSignIn = () => {
    // Prevent multiple clicks
    if (isLoading) return
    setIsLoading(true)

    try {
      // Always save current state before redirecting
      quizService.savePendingQuizData()

      // If a redirectUrl is provided, save it for auth redirect
      if (redirectUrl) {
        quizService.saveAuthRedirect(redirectUrl)
      }

      // Call the provided onSignIn handler
      if (onSignIn) {
        onSignIn()
        return
      }

      // Default behavior if no custom handler
      // Create redirect URL if not provided
      const actualRedirectUrl = redirectUrl || (quizId ? `/dashboard/quiz/${quizId}?fromAuth=true` : "/dashboard")

      // Save auth redirect if not already saved
      if (!redirectUrl) {
        quizService.saveAuthRedirect(actualRedirectUrl)
      }

      // Handle auth redirect
      quizService.handleAuthRedirect(actualRedirectUrl, true)
    } catch (error) {
      console.error("Error during sign in:", error)
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    // Reset loading state if it was set
    setIsLoading(false)

    // Call the provided handler
    if (onContinueAsGuest) {
      onContinueAsGuest()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Save className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Save your progress</p>
                <p className="text-muted-foreground">Access your results from any device</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Track your improvement</p>
                <p className="text-muted-foreground">See your progress over time</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Secure your data</p>
                <p className="text-muted-foreground">Your quiz history is safely stored</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button onClick={handleSignIn} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                {ctaText}
              </span>
            )}
          </Button>

          {allowContinue && onContinueAsGuest && (
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="w-full"
              disabled={isLoading}
              data-testid="continue-as-guest"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </span>
            </Button>
          )}
        </CardFooter>
      </Card>
      {(process.env.NODE_ENV !== "production" || showClearDataButton) && (
        <div className="mt-4 border-t pt-4">
          <p className="text-sm text-muted-foreground mb-2">Testing Tools</p>
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearData || (() => quizService.clearAllQuizData())}
            className="w-full"
            data-testid="clear-data"
          >
            Clear All Storage Data
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            This will clear all local storage, session storage, and cookies, then reload the page.
          </p>
        </div>
      )}
    </motion.div>
  )
}
