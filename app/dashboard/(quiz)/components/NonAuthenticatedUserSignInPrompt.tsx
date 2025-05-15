"use client"

import { Button } from "@/components/ui/button"

export interface NonAuthenticatedUserSignInPromptProps {
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
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <h2 className="text-xl font-semibold mb-2">Sign in to view your {quizType} results</h2>
      {showSaveMessage && (
        <p className="text-muted-foreground mb-4">
          Your progress is saved locally, but you need to sign in to save it to your account and view results.
        </p>
      )}
      <Button onClick={onSignIn}>Sign In</Button>
    </div>
  )
}
