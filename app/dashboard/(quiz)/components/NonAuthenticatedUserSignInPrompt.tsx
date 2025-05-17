"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, LogIn, Save } from "lucide-react"

interface NonAuthenticatedUserSignInPromptProps {
  quizType: "mcq" | "code" | "interview"
  onSignIn?: () => void
  showSaveMessage?: boolean
  previewData?: any
  message?: string
}

export default function NonAuthenticatedUserSignInPrompt({
  quizType,
  onSignIn,
  showSaveMessage = true,
  previewData,
  message,
}: NonAuthenticatedUserSignInPromptProps) {
  const router = useRouter()

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn()
    } else {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/${quizType}`)}`)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4" data-testid="non-authenticated-prompt">
      <Card className="max-w-md w-full bg-background">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl mb-1">Authentication Required</CardTitle>
          <p className="text-muted-foreground">
            {message || "Sign in to see your results and track your progress"}
          </p>
        </CardHeader>
        <CardContent className="pb-2">
          {previewData && (
            <div className="mb-6 p-4 bg-muted rounded-md">
              <div className="font-medium text-center">Quiz Score Preview</div>
              <div className="text-3xl font-bold text-center mt-2">
                {previewData.score}/{previewData.maxScore} ({previewData.percentage}%)
              </div>
            </div>
          )}

          {showSaveMessage && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 text-yellow-800 rounded-md">
              <Save className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm" data-testid="save-message">
                Your progress will be saved when you sign in so you can continue where you left off.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button onClick={handleSignIn} className="w-full" data-testid="sign-in-button">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In to Continue
          </Button>
          <Button
            variant="link"
            onClick={() => router.push("/dashboard/quizzes")}
            className="text-muted-foreground"
          >
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
