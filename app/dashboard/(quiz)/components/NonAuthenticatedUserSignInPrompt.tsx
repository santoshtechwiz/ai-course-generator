"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface NonAuthenticatedUserSignInPromptProps {
  quizType: string
  onSignIn: () => void
  showSaveMessage?: boolean
  previewData?: any
}

export default function NonAuthenticatedUserSignInPrompt({
  quizType,
  onSignIn,
  showSaveMessage = true,
  previewData,
}: NonAuthenticatedUserSignInPromptProps) {
  return (
    <div className="max-w-md mx-auto px-4" data-testid="non-authenticated-prompt">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Sign In to Continue</CardTitle>
          <CardDescription>
            {showSaveMessage 
              ? "Please sign in to save your progress and view your results." 
              : "Please sign in to view your quiz results."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {previewData && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">Your Score Preview</p>
              <div className="text-lg font-semibold">
                {previewData.percentage}% ({previewData.score}/{previewData.maxScore})
              </div>
              <p className="text-sm text-muted-foreground">
                Sign in to save this result and see detailed feedback.
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <Button 
              data-testid="sign-in-button" 
              className="w-full" 
              onClick={onSignIn}
            >
              Sign In
            </Button>
            
            {showSaveMessage && (
              <p className="text-xs text-center text-muted-foreground" data-testid="save-message">
                Don't worry, we'll save your progress!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
