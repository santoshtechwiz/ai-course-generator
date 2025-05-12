"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Gift, Zap, Rocket, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useSubscription } from "@/app/dashboard/subscription/hooks/use-subscription"
import { SubscriptionService } from "@/app/dashboard/subscription/services/subscription-service"
import { useSession } from "next-auth/react"

export default function TrialModal() {
  const { data: session } = useSession()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { handleSubscribe } = useSubscription()
  const router = useRouter()

  const currentMonth = new Date().toLocaleString("default", { month: "long" })

  useEffect(() => {
    async function loadSubscriptionData() {
      if (session?.user?.id) {
        try {
          const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(session.user.id)
          setIsSubscribed(subscriptionStatus.isSubscribed)
          setCurrentPlan(subscriptionStatus.subscriptionPlan)
        } catch (error) {
          console.error("Error fetching subscription status:", error)
          setIsSubscribed(false)
          setCurrentPlan("FREE")
        }
      } else {
        setIsSubscribed(false)
        setCurrentPlan("FREE")
      }
      setIsLoading(false)
    }

    loadSubscriptionData()
  }, [session])

  useEffect(() => {
    const hasSeenTrialModal = localStorage.getItem("hasSeenTrialModal") === "true"
    if (!hasSeenTrialModal && (!isSubscribed || currentPlan === "FREE")) {
      const timer = setTimeout(() => setIsOpen(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [isSubscribed, currentPlan])

  if (isLoading) return null

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem("hasSeenTrialModal", "true")
  }

  const handleStartTrial = async () => {
    if (!session?.user) {
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
      icon: <Zap className="w-5 h-5 text-blue-500" />,
      title: "5 Credits Included",
      description: "Generate quizzes and courses with your free credits.",
    },
    {
      icon: <Rocket className="w-5 h-5 text-green-500" />,
      title: "Advanced Features",
      description: "Access premium tools like Video Quiz and PDF Downloads.",
    },
    {
      icon: <Gift className="w-5 h-5 text-purple-500" />,
      title: "No Credit Card Required",
      description: "Start your trial without payment information.",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-lg shadow-xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 bg-white border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-50 text-blue-600">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Unlock Premium Features</DialogTitle>
              <DialogDescription className="text-gray-600">Try our PRO plan with 5 FREE credits</DialogDescription>
            </div>
          </div>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none">
            <X className="h-5 w-5 text-gray-500" />
          </DialogClose>
        </DialogHeader>

        {/* Main Content */}
        <div className="px-6 py-4 bg-white">
          <div className="flex flex-col lg:flex-row lg:gap-6">
            {/* Left Column */}
            <div className="flex-1 space-y-4">
              {/* Limited Time Offer */}
              <div className="flex items-center justify-center gap-2 p-2 rounded-md bg-blue-50 text-blue-700 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Limited Time Offer! Get 20% off any plan!
              </div>

              {/* Coupon Code */}
              <div className="flex flex-col items-center p-4 border border-blue-200 rounded-lg bg-blue-50">
                <p className="text-sm text-gray-600 mb-2">Use this code at checkout</p>
                <div className="relative w-full max-w-xs">
                  <Input
                    value="AILAUNCH20"
                    readOnly
                    className="text-center text-lg font-bold h-11 bg-white border-blue-300"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full bg-white hover:bg-gray-50 text-blue-600 border-blue-300"
                    onClick={handleCopyCode}
                  >
                    {copied ? (
                      <span className="flex items-center justify-center w-full">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Copied!
                      </span>
                    ) : (
                      "Copy Code"
                    )}
                  </Button>
                </div>
                <p className="text-center mt-2 text-xs text-gray-500">
                  20% off your first payment - Only in {currentMonth}!
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex-1 space-y-4">
              {/* Features */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">What You'll Get</h3>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border">
                        {feature.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{feature.title}</p>
                        <p className="text-xs text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-gray-600 text-center">
              Join thousands of satisfied users who have upgraded to PRO!
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="w-full" onClick={handleClose}>
                Maybe Later
              </Button>
              <Button onClick={handleStartTrial} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
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
