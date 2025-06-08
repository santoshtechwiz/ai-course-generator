"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { QuizType } from "@/app/types/auth-types"

export interface FallbackAction {
  label: string
  onClick: () => void
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined
}

interface NonAuthenticatedUserSignInPromptProps {
  onSignIn: () => void
  title?: string
  message?: string
  score?: {
    percentage: number
  }
  fallbackAction?: FallbackAction
  resultData?: {
    percentage?: number
    score?: number
    maxScore?: number
    [key: string]: any;
  }
  handleRetake?: () => void
}

export function NonAuthenticatedUserSignInPrompt({
  onSignIn,
  title = "Sign In Required",
  message = "Sign in to see your detailed results, save your progress, and track your improvement over time.",
  score,
  fallbackAction,
  resultData,
  handleRetake,
}: NonAuthenticatedUserSignInPromptProps) {
  return (
    <div className="space-y-6">
      <Card className="mb-6 bg-gradient-to-b from-background to-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          {/* Show score if available */}
          {(score?.percentage !== undefined || resultData?.percentage !== undefined) && (
            <div className="mb-4">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="10"
                    strokeDasharray={`${score?.percentage ?? resultData?.percentage} 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{score?.percentage ?? resultData?.percentage}%</span>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6">{message}</p>

          <div className="flex justify-center gap-4">
            <Button onClick={onSignIn} size="lg">
              Sign In to See Full Results
            </Button>

            {/* Show retake button if handler provided */}
            {handleRetake && (
              <Button variant="outline" onClick={handleRetake} size="lg">
                Retake Quiz
              </Button>
            )}

            {/* Show fallback action if provided */}
            {fallbackAction && !handleRetake && (
              <Button variant={fallbackAction.variant || "outline"} onClick={fallbackAction.onClick} size="lg">
                {fallbackAction.label}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="bg-muted/30 p-6 rounded-lg border border-muted mb-6">
            <h3 className="text-lg font-medium mb-2 text-center">Why Sign In?</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>See which questions you answered correctly</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Review detailed explanations for all answers</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Track your progress across all quizzes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Get personalized recommendations for improvement</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
