"use client"
import { motion, AnimatePresence } from "framer-motion"
import type React from "react"

import { User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useSession } from "next-auth/react"

interface SignInBannerProps {
  title?: string
}

export function SignInBanner({ title = "Sign in to create and save your quizzes" }: SignInBannerProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const isAuthenticated = !!session?.user

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn("credentials", { callbackUrl: "/dashboard/mcq" })
    } catch (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
    // No need to set isLoading to false as we're redirecting
  }

  return (
    <AnimatePresence>
      {!isAuthenticated && status !== "loading" && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-yellow-100 border-b border-yellow-200 p-4 flex items-center justify-between"
        >
          <div className="flex items-center">
            <User className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">{title}</span>
          </div>
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            variant="outline"
            className="bg-yellow-200 text-yellow-800 hover:bg-yellow-300 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
