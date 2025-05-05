"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { UserIcon, SaveIcon } from "lucide-react"

interface NonAuthenticatedUserSignInPromptProps {
  onSignIn: () => void
  onContinueAsNonAuthenticatedUser: () => void
  quizType?: string
  showSaveMessage?: boolean
  "data-testid"?: string
}

export default function NonAuthenticatedUserSignInPrompt({
  onSignIn,
  onContinueAsNonAuthenticatedUser,
  quizType = "quiz",
  showSaveMessage = true,
  "data-testid": dataTestId,
}: NonAuthenticatedUserSignInPromptProps) {
  return (
    <div className="w-full max-w-md mx-auto mt-8" data-testid={dataTestId}>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Sign in to save your progress</CardTitle>
          <CardDescription>
            Your {quizType} results are ready! Sign in to save your progress and track your learning journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-md">
            <SaveIcon className="h-6 w-6 text-gray-500" />
            <div>
              <h3 className="font-medium">Save your results</h3>
              <p className="text-sm text-gray-500">Track your progress over time</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-md">
            <UserIcon className="h-6 w-6 text-gray-500" />
            <div>
              <h3 className="font-medium">Create your profile</h3>
              <p className="text-sm text-gray-500">Access personalized learning recommendations</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={onSignIn} className="w-full">
            Sign in
          </Button>
          <Button onClick={onContinueAsNonAuthenticatedUser} variant="outline" className="w-full">
            Continue without signing in
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
