"use client"

import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, LogIn, Save, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface GuestSignInPromptProps {
  callbackUrl?: string
  quizType?: string
  quizId?: string
  score?: number
  onSkip?: () => void
}

// Add the missing fixCallbackUrl function
function fixCallbackUrl(url: string): string {
  if (!url) return "/dashboard"

  // Replace /quiz/ with /dashboard/ in the URL path
  if (url.includes("/quiz/")) {
    return url.replace("/quiz/", "/dashboard/")
  }

  return url
}

export function GuestSignInPrompt({
  callbackUrl = "/dashboard",
  quizType = "quiz",
  quizId,
  score,
  onSkip,
}: GuestSignInPromptProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Fix the handleSignIn function to properly handle redirection
  const handleSignIn = async () => {
    setIsLoading(true)

    // Ensure the callbackUrl is properly formatted and preserved
    let redirectUrl = callbackUrl

    // Fix the callback URL to ensure it uses /dashboard/ instead of /quiz/
    redirectUrl = fixCallbackUrl(redirectUrl)

    // If callbackUrl doesn't include the quiz type and ID, construct it
    if (quizId && quizType && !redirectUrl.includes(quizId)) {
      redirectUrl = `/dashboard/${quizType==='fill-blanks'?"blanks":quizType}/${quizId}`
    }

    // Add completed=true parameter if it's not already there
    if (!redirectUrl.includes("completed=true")) {
      redirectUrl += `${redirectUrl.includes("?") ? "&" : "?"}completed=true`
    }

    console.log("Signing in with callback URL:", redirectUrl)

    try {
      // Don't encode the URL - let the signIn function handle it
      // Use the default provider instead of specifying "credentials"
      await signIn(undefined, { callbackUrl: redirectUrl })
    } catch (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Save Your Progress</CardTitle>
          <CardDescription className="text-center">
            {score !== undefined ? (
              <>
                You scored <span className="font-bold text-primary">{score}%</span>! Sign in to save your results.
              </>
            ) : (
              <>Sign in to save your progress and track your learning journey.</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 rounded-full p-4 mb-2">
              <Save className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">Create an account to:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center justify-center gap-2">
                <ArrowRight className="h-3 w-3 text-primary" />
                Save your quiz results
              </li>
              <li className="flex items-center justify-center gap-2">
                <ArrowRight className="h-3 w-3 text-primary" />
                Track your progress over time
              </li>
              <li className="flex items-center justify-center gap-2">
                <ArrowRight className="h-3 w-3 text-primary" />
                Access personalized learning recommendations
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleSignIn} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in to save
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onSkip || (() => router.push("/dashboard"))}
            className="w-full"
            disabled={isLoading}
          >
            Continue without saving
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
