"use client"

import { useQuiz } from "@/app/context/QuizContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Save, ArrowRight } from "lucide-react"


export function GuestPrompt() {
  const { handleSignIn, closeAuthPrompt, state } = useQuiz()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Quiz Completed!</CardTitle>
        <CardDescription className="text-center">Sign in to save your results and track your progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="bg-primary/10 rounded-full p-4 mb-2">
            <Save className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Your Score</span>
            <span className="font-medium">{state.score}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${state.score}%` }}></div>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Sign in to save your progress, view detailed results, and access all quiz features.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSignIn} className="w-full">
          <LogIn className="mr-2 h-4 w-4" />
          Sign in to continue
        </Button>
        <Button variant="outline" onClick={closeAuthPrompt} className="w-full">
          <ArrowRight className="mr-2 h-4 w-4" />
          View Results
        </Button>
      </CardFooter>
    </Card>
  )
}
