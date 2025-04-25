"use client"

import { useQuiz } from "@/app/context/QuizContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Save, ArrowRight, Loader2 } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export function GuestPrompt() {
  const { handleSignIn, closeAuthPrompt, state } = useQuiz()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignInClick = async () => {
    setIsLoading(true)
    try {
      await handleSignIn()
    } catch (error) {
      console.error("Error during sign in:", error)
      setIsLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="space-y-1 bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="text-2xl font-bold text-center">Quiz Completed!</CardTitle>
          <CardDescription className="text-center">
            Sign in to save your results and track your progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
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
              <div
                className={`h-2.5 rounded-full ${
                  state.score >= 80 ? "bg-green-500" : state.score >= 60 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${state.score}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              Sign in to save your progress, view detailed results, and access all quiz features.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 border-t pt-4">
          <Button onClick={handleSignInClick} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in to continue
              </>
            )}
          </Button>
          <Button variant="outline" onClick={closeAuthPrompt} className="w-full">
            <ArrowRight className="mr-2 h-4 w-4" />
            View Results
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
