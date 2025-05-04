"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, UserCircle } from "lucide-react"

interface GuestSignInPromptProps {
  onSignIn: () => void
  onBack: () => void
  "data-testid"?: string
}

export default function GuestSignInPrompt({ onSignIn, onBack, ...props }: GuestSignInPromptProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto" {...props}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign in to save your progress</CardTitle>
        <CardDescription className="text-base mt-2">
          Your quiz results are ready! Sign in to save your progress and track your learning journey.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-4 p-4 rounded-lg border">
            <FileText className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-medium">Save your results</h3>
              <p className="text-sm text-muted-foreground">Track your progress over time</p>
            </div>
          </div>
          <div className="flex items-start space-x-4 p-4 rounded-lg border">
            <UserCircle className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-medium">Create your profile</h3>
              <p className="text-sm text-muted-foreground">Access personalized learning recommendations</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button className="w-full" onClick={onSignIn}>
          Sign in
        </Button>
        <Button variant="outline" className="w-full" onClick={onBack}>
          Continue as guest
        </Button>
      </CardFooter>
    </Card>
  )
}
