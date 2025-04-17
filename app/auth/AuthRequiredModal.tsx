"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { saveQuizStateBeforeAuth } from "@/hooks/quiz-session-storage"

interface AuthRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
  quizState?: any
  answers?: any[]
  redirectPath?: string
}

export default function AuthRequiredModal({
  isOpen,
  onClose,
  message = "Please sign in to save your progress and see your results.",
  quizState,
  answers,
  redirectPath,
}: AuthRequiredModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Save quiz state to session storage when modal opens
  useEffect(() => {
    if (isOpen && quizState && answers && redirectPath) {
      saveQuizStateBeforeAuth(quizState, answers, redirectPath)
    }
  }, [isOpen, quizState, answers, redirectPath])

  const handleSignIn = async (provider: string) => {
    try {
      setIsLoading(true)
      await signIn(provider, { callbackUrl: redirectPath || window.location.href })
    } catch (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button onClick={() => handleSignIn("google")} disabled={isLoading} className="w-full" variant="outline">
            {isLoading ? "Signing in..." : "Continue with Google"}
          </Button>
          <Button onClick={() => handleSignIn("github")} disabled={isLoading} className="w-full" variant="outline">
            {isLoading ? "Signing in..." : "Continue with GitHub"}
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
