"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Gift, Zap, Rocket, CheckCircle2, Star, Sparkles } from "lucide-react"
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
import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"
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
  const [copied, setCopied] = useState(false)
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText("AILAUNCH20")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      title: "5 Credits Included",
      description: "Generate quizzes and courses with your free credits.",
    },
    {
      icon: <Rocket className="w-5 h-5 text-purple-500" />,
      title: "Advanced Features",
      description: "Access premium tools like Video Quiz and PDF Downloads.",
    },
    {
      icon: <Gift className="w-5 h-5 text-pink-500" />,
      title: "No Credit Card Required",
      description: "Start your trial without payment information.",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[90vw] max-w-[550px] gap-0 p-0 overflow-hidden rounded-xl shadow-2xl border-4 border-purple-500">
        {/* Decorative stars */}
        <div className="absolute -top-4 -left-4 animate-spin-slow">
          <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
        </div>
        <div className="absolute -top-4 -right-4 animate-bounce">
          <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
        </div>

        <div className="relative">
          {/* Header with dynamic discount banner */}
          <DialogHeader className="border-b px-4 sm:px-6 py-4 bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 text-white">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative animate-pulse">
                <div className="absolute inset-0 bg-white rounded-full blur-md"></div>
                <div className="relative p-2 sm:p-3 rounded-full bg-white text-purple-600">
                  <Gift className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold mb-1 animate-bounce">
                  UNLOCK PREMIUM FEATURES!
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base text-white">
                  Try our PRO plan with 5 FREE credits
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none">
              <X className="h-5 w-5" />
            </DialogClose>

            {/* SVG Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 0 10 L 40 10 M 10 0 L 10 40" stroke="white" strokeWidth="1" fill="none" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Dynamic limited time offer banner */}
            <div className="mt-3 rounded-lg bg-red-600 p-2 text-center text-sm sm:text-base font-bold animate-flash relative z-10">
              <Sparkles className="h-4 w-4 inline-block mr-1 animate-spin-slow" />
              LIMITED TIME OFFER! Get 20% off any plan!
              <Sparkles className="h-4 w-4 inline-block ml-1 animate-spin-slow" />
            </div>
          </DialogHeader>

          <div className="px-4 sm:px-6 py-4 space-y-4 bg-gradient-to-b from-purple-50 to-white">
            {/* Coupon Code Section - Always Visible */}
            <div className="flex flex-col items-center p-3 border-3 border-dashed border-purple-500 rounded-lg bg-white">
              <p className="text-sm text-gray-500 mb-2">Use this code at checkout</p>
              <div className="relative w-full max-w-[280px]">
                <Input
                  id="discount-code"
                  value="AILAUNCH20"
                  readOnly
                  className="text-center text-xl font-bold h-12 bg-yellow-50 border-2 border-yellow-400 animate-pulse-slow"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <svg width="100%" height="100%" className="absolute inset-0">
                    <defs>
                      <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="none" />
                    <rect width="30%" height="100%" fill="url(#shine)" className="animate-shine" />
                  </svg>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 w-full max-w-[280px] bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <span className="flex items-center justify-center w-full">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Copied!
                  </span>
                ) : (
                  "COPY CODE"
                )}
              </Button>
              <p className="text-center mt-2 text-xs text-gray-500">
                20% off your first payment - Only in {currentMonth}!
              </p>
            </div>

            {/* Features Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-purple-800">Amazing Features</h3>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2 rounded-lg bg-white border-2 border-purple-200 shadow-md hover:shadow-lg transition-all duration-300 animate-pulse-slow"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-purple-800">{feature.title}</p>
                      <p className="text-xs text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center p-3 bg-purple-100 rounded-lg border border-purple-200">
              <p className="text-purple-800 font-medium text-sm">
                Join thousands of satisfied users who have upgraded to PRO!
              </p>
            </div>
          </div>

          <div className="border-t px-4 sm:px-6 py-4 bg-gradient-to-r from-purple-700 to-pink-600">
            <div className="flex flex-col items-center gap-3">
              <p className="text-white font-bold text-sm sm:text-base animate-pulse text-center">
                🔥 Don't miss this opportunity! 🔥
              </p>
              <div className="flex gap-2 w-full justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="bg-white/20 text-white border-white hover:bg-white/30"
                >
                  Maybe Later
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartTrial}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold animate-pulse-slow shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-1" />
                      GET FREE CREDITS!
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
