"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export interface FallbackAction {
  label: string
  onClick: () => void
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined
}

interface NonAuthenticatedUserSignInPromptProps {
  onSignIn: () => void
  title?: string
  message?: string
  previewData?: {
    percentage?: number
    score?: number
    maxScore?: number
  }
  fallbackAction?: FallbackAction
  quizType?: string
}

export function NonAuthenticatedUserSignInPrompt({
  onSignIn,
  title = "Sign In Required",
  message = "Sign in to see your detailed results, save your progress, and track your improvement over time.",
  previewData,
  fallbackAction,
  quizType,
}: NonAuthenticatedUserSignInPromptProps) {
  return (
    <Card className="mb-6 bg-gradient-to-b from-background to-primary/10 border-primary/20">
      <CardContent className="p-6 text-center">
        {/* Show score if available */}
        {previewData?.percentage !== undefined && (
          <h2 className="text-2xl font-bold mb-3">
            Your Score: {previewData.percentage}%
          </h2>
        )}

        {/* Title if no score is shown */}
        {previewData?.percentage === undefined && (
          <h2 className="text-2xl font-bold mb-3">{title}</h2>
        )}

        <p className="text-muted-foreground mb-6">{message}</p>

        <div className="flex justify-center gap-4">
          <Button onClick={onSignIn} size="lg">
            Sign In to See Full Results
          </Button>

          {/* Show fallback action if provided */}
          {fallbackAction && (
            <Button
              variant={fallbackAction.variant || "outline"}
              onClick={fallbackAction.onClick}
              size="lg"
            >
              {fallbackAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default NonAuthenticatedUserSignInPrompt
