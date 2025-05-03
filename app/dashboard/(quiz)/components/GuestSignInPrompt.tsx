"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, LogIn, UserPlus } from "lucide-react"
import { motion } from "framer-motion"

interface GuestSignInPromptProps {
  onContinueAsGuest: () => void
  onSignIn?: () => void
  quizType?: string
  showSaveMessage?: boolean
}

export  function GuestSignInPrompt({
  onContinueAsGuest,
  onSignIn,
  quizType = "quiz",
  showSaveMessage = true,
}: GuestSignInPromptProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)

    try {
      // Store current URL to redirect back after login
      localStorage.setItem("authRedirectUrl", window.location.href)

      // Call the onSignIn callback if provided
      if (onSignIn) {
        onSignIn()
      }

      // Redirect to sign in page
      await signIn("google", { callbackUrl: window.location.href })
    } catch (error) {
      console.error("Error signing in:", error)
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-xl">Sign in to continue</CardTitle>
          </div>
          <CardDescription>
            {showSaveMessage ? (
              <>Sign in to save your {quizType} progress and results.</>
            ) : (
              <>Sign in to access all features and track your progress.</>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-md text-sm">
            <p className="font-medium mb-2">Benefits of signing in:</p>
            <ul className="space-y-1 list-disc pl-4 text-muted-foreground">
              <li>Save your progress and results</li>
              <li>Track your performance over time</li>
              <li>Access your history from any device</li>
              <li>Unlock additional features</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onContinueAsGuest}>
            <UserPlus className="mr-2 h-4 w-4" />
            Continue as Guest
          </Button>

          <Button className="w-full sm:w-auto" onClick={handleSignIn} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
