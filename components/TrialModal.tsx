/**
 * Trial Modal Component
 *
 * This component displays a modal offering a free trial
 * for users who are not subscribed to a paid plan.
 */

"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
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
}: {
  isSubscribed: boolean
  currentPlan: SubscriptionPlanType | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { handleSubscribe, isLoading } = useSubscription()

  // Show the modal only for non-subscribed users or free plan users
  useEffect(() => {
    // Check if the user has dismissed the modal before
    const hasSeenTrialModal = localStorage.getItem("hasSeenTrialModal") === "true"

    if (!hasSeenTrialModal && (!isSubscribed || currentPlan === "FREE")) {
      // Show the modal after a short delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isSubscribed, currentPlan])

  // Handle modal close
  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem("hasSeenTrialModal", "true")
  }

  // Handle trial activation
  const handleStartTrial = async () => {
    const success = await handleSubscribe("PRO", 1)
    if (success) {
      handleClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Try PRO Plan Free for 7 Days</DialogTitle>
          <DialogDescription>
            Experience all the premium features with no commitment. Cancel anytime during the trial period.
          </DialogDescription>
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
            <div className="flex items-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-primary"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium">250 Tokens Included</h3>
                <p className="text-sm text-muted-foreground">
                  Generate more quizzes and courses with increased token allowance
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-primary"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium">Advanced Features</h3>
                <p className="text-sm text-muted-foreground">
                  Access to Video Quiz, PDF Downloads, and AI Accuracy features
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-primary"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium">No Credit Card Required</h3>
                <p className="text-sm text-muted-foreground">
                  Start your trial without payment information. No automatic charges.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <Button variant="outline" onClick={handleClose}>
            Maybe Later
          </Button>
          <Button onClick={handleStartTrial} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "Processing..." : "Start 7-Day Free Trial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

