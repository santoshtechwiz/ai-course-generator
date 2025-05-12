"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface NonAuthenticatedUserSignInPromptProps {
  onSignIn: () => void
  quizType?: string
  showSaveMessage?: boolean
}

export default function NonAuthenticatedUserSignInPrompt({
  onSignIn,
  quizType = "quiz",
  showSaveMessage = true,
}: NonAuthenticatedUserSignInPromptProps) {
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to save your progress</CardTitle>
          <CardDescription>Complete this {quizType} and track your progress over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            {showSaveMessage
              ? "Your quiz results are ready! Sign in to view them and save your progress."
              : "Sign in to save your quiz progress and access all features."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Skip for now
          </Button>
          <Button onClick={onSignIn}>Sign in</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
