"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn, ArrowRight, Shield, Clock, Save } from "lucide-react"
import { useAuth } from "@/providers/unified-auth-provider"
import { quizService } from "@/lib/quiz-service"

interface AuthPromptProps {
  quizId?: string
  forceShow?: boolean
  onContinueWithoutAccount?: () => void
  onSignInClick?: () => void
  allowContinue?: boolean
  title?: string
  description?: string
  ctaText?: string
}

export function GuestSignInPrompt({
  quizId,
  forceShow = false,
  onContinueWithoutAccount,
  onSignInClick,
  allowContinue = true,
  title = "Save your progress",
  description = "Sign in to save your quiz progress and access your results anytime.",
  ctaText = "Sign in",
}: AuthPromptProps) {
  const { isAuthenticated, user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // If user is authenticated and this isn't forced, don't show
  if (isAuthenticated && !forceShow) {
    return null
  }

  const handleSignIn = () => {
    if (onSignInClick) {
      onSignInClick()
      return
    }

    setIsLoading(true)

    // Default behavior if no custom handler
    try {
      // Create redirect URL
      const redirectUrl = quizId ? `/dashboard/quiz/${quizId}?fromAuth=true` : "/dashboard"

      // Save current state before redirecting
      quizService.savePendingQuizData()

      // Handle auth redirect
      quizService.handleAuthRedirect(redirectUrl, true)
    } catch (error) {
      console.error("Error during sign in:", error)
      setIsLoading(false)
    }
  }

  const handleContinueWithoutAccount = () => {
    if (onContinueWithoutAccount) {
      onContinueWithoutAccount()
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

          {allowContinue && (
            <Button variant="outline" onClick={handleContinueWithoutAccount} className="w-full" disabled={isLoading}>
              <span className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Continue without account
              </span>
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
