"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn, Save, User, Shield } from "lucide-react"
import { motion } from "framer-motion"

interface NonAuthenticatedUserSignInPromptProps {
  onSignIn: () => void
  onContinueAsGuest?: () => void
  showSaveMessage?: boolean
  quizType?: string
}

export default function NonAuthenticatedUserSignInPrompt({
  onSignIn,
  onContinueAsGuest,
  showSaveMessage = false,
  quizType = "quiz",
}: NonAuthenticatedUserSignInPromptProps) {
  return (
    <motion.div
      data-testid="guest-sign-in-prompt"
      className="max-w-md mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/20 shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-2">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Sign In Required</CardTitle>
          <CardDescription>
            You've completed the {quizType}. Sign in to save your results and track your progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {showSaveMessage && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
              <div className="flex items-start gap-3">
                <Save className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-300">Save your progress</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Sign in to save your quiz results, track your progress over time, and access your quiz history.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button data-testid="sign-in" onClick={onSignIn} className="w-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In to Save Results
            </Button>

            {onContinueAsGuest && (
              <Button
                data-testid="continue-as-guest"
                onClick={onContinueAsGuest}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <User className="mr-2 h-4 w-4" />
                Continue Without Signing In
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-center text-muted-foreground flex justify-center">
          <p className="max-w-xs">
            Note: Results will not be saved and will be lost when you leave this page unless you sign in.
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
