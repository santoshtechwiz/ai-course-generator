"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  onSignIn?: () => Promise<void> | void
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
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Don't show if already signed in (unless forced)
  if (isAuthenticated && !forceShow) return null

  const handleSignIn = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      // Save current quiz state before any redirect
      await quizService.savePendingQuizData()

      // Determine where to return after auth
      const destination =
        redirectUrl || (quizId ? `/dashboard/quiz/${quizId}?fromAuth=true` : "/dashboard")

      // Persist redirect URL
      await quizService.saveAuthRedirect(destination)

      // Custom onSignIn takes precedence
      if (onSignIn) {
        await Promise.resolve(onSignIn())
      } else {
        // Default redirect flow
        await quizService.handleAuthRedirect(destination, true)
      }
    } catch (error) {
      console.error("Error during sign-in flow:", error)
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    if (isLoading) return
    setIsLoading(false)
    onContinueAsGuest?.()
  }

  const handleClearAll = () => {
    if (onClearData) {
      onClearData()
    } else {
      quizService.clearAllStorageData().finally(() => {
        window.location.reload()
      })
    }
  }

  return (
    <motion.section
      aria-labelledby="guest-signin-title"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle id="guest-signin-title" className="text-2xl">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Benefits List */}
          <ul className="space-y-3" role="list">
            {[
              {
                icon: Save,
                heading: "Save your progress",
                detail: "Access your results from any device",
              },
              {
                icon: Clock,
                heading: "Track your improvement",
                detail: "See your progress over time",
              },
              {
                icon: Shield,
                heading: "Secure your data",
                detail: "Your quiz history is safely stored",
              },
            ].map(({ icon: Icon, heading, detail }) => (
              <li
                key={heading}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <Icon className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-medium">{heading}</p>
                  <p className="text-muted-foreground">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleSignIn}
            className="w-full"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {ctaText}
              </span>
            )}
          </Button>

          {allowContinue && (
            <Button
              variant="outline"
              onClick={handleContinue}
              className="w-full"
              disabled={isLoading}
              data-testid="continue-as-guest"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Restart Quiz
              </span>
            </Button>
          )}
        </CardFooter>
      </Card>

      {(process.env.NODE_ENV !== "production" || showClearDataButton) && (
        <section className="mt-4 border-t pt-4">
          <p className="text-sm text-muted-foreground mb-2">Testing Tools</p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAll}
            className="w-full"
            data-testid="clear-data"
          >
            Clear All Storage Data
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            This will clear all local storage, session storage, and cookies, then reload the page.
          </p>
        </section>
      )}
    </motion.section>
  )
}
