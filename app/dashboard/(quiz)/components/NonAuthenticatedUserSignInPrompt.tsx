"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { LogIn, Award, Save } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface NonAuthenticatedUserPromptProps {
  quizType: string
  onSignIn: () => void
  showSaveMessage?: boolean
  previewData?: {
    score: number
    maxScore: number
    percentage: number
    title: string
  } | null
}

export default function NonAuthenticatedUserSignInPrompt({
  quizType,
  onSignIn,
  showSaveMessage = false,
  previewData,
}: NonAuthenticatedUserPromptProps) {
  const hasPreviewData = previewData && typeof previewData.score === 'number';

  return (
    <Card className="max-w-lg mx-auto shadow-md" data-testid="non-authenticated-prompt">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Award className="h-5 w-5" />
          <span>{hasPreviewData ? "Save Your Quiz Results" : "Sign in to Continue"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPreviewData ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">Your Score</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-2xl font-bold">{previewData.score}/{previewData.maxScore}</p>
                <p className={`text-lg font-medium px-2 py-0.5 rounded-md ${previewData.percentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {previewData.percentage}%
                </p>
              </div>
              <Progress value={previewData.percentage} className="mt-2 h-2" />
              <p className="mt-3 text-muted-foreground">
                Sign in to save your results and track your progress over time.
              </p>
            </div>
          </div>
        ) : (
          <p>
            To continue with this {quizType} and save your progress, please sign in to your account.
            {showSaveMessage && (
              <span className="block mt-2 text-green-600" data-testid="save-message">
                <Save className="inline h-4 w-4 mr-1" />
                Your progress will be saved automatically.
              </span>
            )}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSignIn}
          className="w-full flex items-center justify-center gap-2"
          data-testid="sign-in-button"
          size="lg"
        >
          <LogIn className="h-4 w-4" />
          <span>Sign in to {hasPreviewData ? "Save Results" : "Continue"}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
