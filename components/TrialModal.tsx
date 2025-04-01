"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { SubscriptionPlanType } from "@/app/types/subscription"
import { useSubscription } from "@/hooks/use-subscription"

export default function TrialModal({
  isSubscribed,
  currentPlan,
  user,
}: {
  isSubscribed: boolean
  currentPlan: SubscriptionPlanType | null
  user?: { id: string } | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { handleSubscribe, isLoading } = useSubscription()
  const router = useRouter()

  useEffect(() => {
    const hasSeenTrialModal = localStorage.getItem("hasSeenTrialModal") === "true"
    if (!hasSeenTrialModal && (!isSubscribed || currentPlan === "FREE")) {
      setIsOpen(true)
    }
  }, [isSubscribed, currentPlan])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem("hasSeenTrialModal", "true")
  }

  const handleStartTrial = async () => {
    if (!user) {
      handleClose()
      router.push("/dashboard/subscription")
      return
    }
    const success = await handleSubscribe("FREE", 5, "", 0)
    if (success) handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Try PRO Plan with 5 Free Credits</DialogTitle>
          <DialogDescription>Experience all the premium features with no commitment.</DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-3">
            {["5 Credits Included", "Advanced Features", "No Credit Card Required"].map((title, index) => (
              <div key={index} className="flex items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-primary"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {title === "5 Credits Included" && "Generate quizzes and courses with your free credits."}
                    {title === "Advanced Features" && "Access to Video Quiz, PDF Downloads, and AI Accuracy features."}
                    {title === "No Credit Card Required" && "Start your trial without payment information."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <Button variant="outline" onClick={handleClose}>Maybe Later</Button>
          <Button onClick={handleStartTrial} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Get 5 Free Credits"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
