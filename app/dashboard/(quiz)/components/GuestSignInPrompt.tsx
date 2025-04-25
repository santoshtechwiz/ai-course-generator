"use client"

import { useQuiz } from "@/app/context/QuizContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Save, ArrowRight, Loader2, Clock } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

export function GuestPrompt() {
  const { handleSignIn, closeAuthPrompt, state } = useQuiz()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
      >
        <Card className="w-full max-w-md mx-auto shadow-lg overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 z-0"
          />

          <CardHeader className="space-y-1 relative z-10 bg-gradient-to-r from-primary/10 to-transparent">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CardTitle className="text-2xl font-bold text-center">Quiz Completed!</CardTitle>
              <CardDescription className="text-center">
                Sign in to save your results and track your progress
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-4 pt-6 relative z-10">
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 }}
            >
              <div className="bg-primary/10 rounded-full p-4 mb-2">
                <Save className="h-8 w-8 text-primary" />
              </div>
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex justify-between text-sm">
                <span>Your Score</span>
                <motion.span
                  className="font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  {state.score}%
                </motion.span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className={`h-2.5 rounded-full ${
                    state.score >= 80 ? "bg-green-500" : state.score >= 60 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${state.score}%` }}
                  transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            <motion.div
              className="bg-muted/50 p-4 rounded-lg border border-border/50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <p className="text-center text-sm text-muted-foreground">
                Sign in to save your progress, view detailed results, and access all quiz features.
                {state.guestResult && state.guestResultTimer > 0 && (
                  <motion.div
                    className="flex items-center justify-center mt-2 gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Clock className="h-4 w-4 text-destructive animate-pulse" />
                    <span className="font-medium text-destructive">
                      Guest results available for <span className="tabular-nums">{state.guestResultTimer}</span> seconds
                    </span>
                  </motion.div>
                )}
              </p>
            </motion.div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 border-t pt-4 relative z-10">
            <motion.div
              className="w-full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
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
            </motion.div>

            <motion.div
              className="w-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button variant="outline" onClick={closeAuthPrompt} className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                View Results as Guest
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
