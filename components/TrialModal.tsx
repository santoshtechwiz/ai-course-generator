"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Gift, Zap, Rocket, BadgePercent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { cn } from "@/lib/utils"
import { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"
import { useSubscription } from "@/app/dashboard/subscription/hooks/use-subscription"

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
  const [showDiscount, setShowDiscount] = useState(false)
  const { handleSubscribe, isLoading } = useSubscription()
  const router = useRouter()

  // Determine the current month and format it (e.g., "April")
  const currentMonth = new Date().toLocaleString("default", { month: "long" })

  useEffect(() => {
    const hasSeenTrialModal = localStorage.getItem("hasSeenTrialModal") === "true"
    if (!hasSeenTrialModal && (!isSubscribed || currentPlan === "FREE")) {
      const timer = setTimeout(() => setIsOpen(true), 3000)
      return () => clearTimeout(timer)
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

  const features = [
    {
      icon: <Zap className="w-4 h-4 text-primary" />,
      title: "5 Credits Included",
      description: "Generate quizzes and courses with your free credits."
    },
    {
      icon: <Rocket className="w-4 h-4 text-primary" />,
      title: "Advanced Features",
      description: "Access premium tools like Video Quiz and PDF Downloads."
    },
    {
      icon: <Gift className="w-4 h-4 text-primary" />,
      title: "No Credit Card Required",
      description: "Start your trial without payment information."
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] gap-0 p-0 overflow-hidden">
        <div className="relative">
          {/* Header with dynamic discount banner */}
          <DialogHeader className="border-b px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                "bg-white text-purple-500"
              )}>
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Unlock Premium Features
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Try our PRO plan with 5 free credits
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none">
              <X className="h-4 w-4" />
            </DialogClose>
            {/* Dynamic limited time offer banner */}
            <div className="mt-2 rounded bg-red-600 p-2 text-center text-xs font-bold">
              Limited Time Offer! Get 20% off any plan with code <span className="underline">AILAUNCH20</span> - Only in {currentMonth}!
            </div>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4 bg-white">
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                    {feature.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {feature.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-sm justify-start pl-1.5"
                onClick={() => setShowDiscount(!showDiscount)}
              >
                <BadgePercent className="h-3.5 w-3.5 mr-2" />
                Have a discount code?
                <span className={cn(
                  "ml-auto transition-transform",
                  showDiscount ? "rotate-180" : ""
                )}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </Button>

              {showDiscount && (
                <div className="mt-2 space-y-2 animate-in fade-in">
                  <Label htmlFor="discount-code" className="text-xs">
                    Enter discount code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="discount-code"
                      placeholder="AILAUNCH20"
                      className="h-8"
                      readOnly
                      value="AILAUNCH20"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText("AILAUNCH20")
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    20% off your first payment
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t px-6 py-3 bg-gray-100">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                Maybe Later
              </Button>
              <Button
                size="sm"
                onClick={handleStartTrial}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Get Free Credits
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
