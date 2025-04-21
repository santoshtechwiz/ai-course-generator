"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LightbulbIcon, BrainIcon, TrophyIcon, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"

interface SignInPromptProps {
  title?: string
  message?: string
  callbackUrl?: string
}

const quotes = [
  { text: "Knowledge is power. Test yours!", icon: LightbulbIcon },
  { text: "Challenge your mind, grow your skills.", icon: BrainIcon },
  { text: "Practice makes perfect. Start now!", icon: TrophyIcon },
]

export const SignInPrompt: React.FC<SignInPromptProps> = ({
  title = "Unlock Your Potential",
  message = "Sign in to view your results, track progress, and join the community of learners.",
  callbackUrl = "/dashboard",
}) => {
  const [currentQuote, setCurrentQuote] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Fix the callback URL to ensure it uses /dashboard/ instead of /quiz/
      let fixedCallbackUrl = callbackUrl

      // If the URL contains /quiz/, replace it with /dashboard/
      if (fixedCallbackUrl.includes("/quiz/")) {
        fixedCallbackUrl = fixedCallbackUrl.replace("/quiz/", "/dashboard/")
      }

      // Ensure the URL starts with /dashboard if it's a relative path
      if (fixedCallbackUrl.startsWith("/") && !fixedCallbackUrl.startsWith("/dashboard")) {
        // But don't duplicate /dashboard if it's already there
        if (!fixedCallbackUrl.startsWith("/dashboard")) {
          fixedCallbackUrl = `/dashboard${fixedCallbackUrl}`
        }
      }

      await signIn(undefined, { callbackUrl: fixedCallbackUrl })
    } catch (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
    // No need to set isLoading to false as we're redirecting
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8 overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <motion.div
          className="rounded-lg bg-primary/10 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-4"
            >
              {React.createElement(quotes[currentQuote].icon, { className: "h-6 w-6 text-primary" })}
              <p className="text-sm text-primary font-medium">{quotes[currentQuote].text}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Why sign in?</span>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          <motion.li
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <svg className="mr-2 h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Track your progress over time
          </motion.li>
          <motion.li
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <svg className="mr-2 h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Compete with friends and peers
          </motion.li>
          <motion.li
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <svg className="mr-2 h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Access exclusive quizzes and content
          </motion.li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSignIn} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In to Continue"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
