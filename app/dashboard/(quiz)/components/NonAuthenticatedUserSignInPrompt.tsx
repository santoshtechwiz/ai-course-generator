"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks"
import { signIn } from "next-auth/react"
import type { QuizType } from "@/app/types/quiz-types"
import type { BaseQuizPreview } from "@/app/types/quiz-base"

interface NonAuthenticatedUserSignInPromptProps {
  quizType: QuizType
  onSignIn: () => void
  showSaveMessage?: boolean
  message?: string
  previewData: BaseQuizPreview
  returnPath?: string
}

export default function NonAuthenticatedUserSignInPrompt({
  quizType = "mcq",
  onSignIn,
  showSaveMessage = true,
  message = "Sign in to save your progress and access more features",
  previewData,
  returnPath,
}: NonAuthenticatedUserSignInPromptProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)

    if (onSignIn) {
      onSignIn()
      return
    }

    try {
      await signIn("google", {
        callbackUrl: returnPath || `/dashboard/${quizType}`,
      })
    } catch (error) {
      console.error("Sign in error:", error)
      toast({
        title: "Sign in failed",
        description: "Please try again later",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const getQuizTypeName = () => {
    switch (quizType) {
      case "mcq":
        return "Multiple Choice Quiz"
      case "blanks":
        return "Fill in the Blanks Quiz"
      case "openended":
        return "Open-Ended Quiz"
      case "code":
        return "Code Quiz"
      default:
        return "Quiz"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container max-w-lg mx-auto px-4 py-8"
    >
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/20 rounded-full" data-testid="lock-icon-container">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{getQuizTypeName()} Results</CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {previewData && (
            <div className="space-y-4" data-testid="score-preview">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary">{previewData.percentage}%</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-lg font-medium">
                  Your Score: {previewData.score} / {previewData.maxScore}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {previewData.percentage >= 70 ? (
                    <span
                      className="flex items-center justify-center gap-1 text-green-600"
                      data-testid="positive-feedback"
                    >
                      <CheckCircle className="h-4 w-4" /> Great job!
                    </span>
                  ) : (
                    <span
                      className="flex items-center justify-center gap-1 text-amber-600"
                      data-testid="improvement-feedback"
                    >
                      <XCircle className="h-4 w-4" /> Room for improvement
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {showSaveMessage && (
            <div
              className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-lg text-sm"
              data-testid="save-message"
            >
              <p>Your progress isn't saved. Sign in to save your results and track your progress.</p>
            </div>
          )}

          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={handleSignIn} className="w-full" disabled={isLoading} data-testid="sign-in-button">
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </>
              ) : (
                "Sign in to Continue"
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = "/dashboard")}
              data-testid="return-dashboard-button"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
