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
import { migratedStorage } from "@/lib/storage"
import { toast } from "@/hooks/use-toast"

import { useSession } from "next-auth/react"
import useSubscription from "@/hooks/use-subscription"


export default function TrialModal() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const {
    isSubscribed,
    totalTokens,
    refreshSubscription,
  } = useSubscription()
  const router = useRouter()
  const {data:subscription} = useSubscription();
  const currentMonth = new Date().toLocaleString("default", { month: "long" })

  useEffect(() => {
    const hasSeenTrialModal = migratedStorage.getPreference("seen_trial_modal", false)
    if (!hasSeenTrialModal && (!isSubscribed || totalTokens === 0)) {
      const timer = setTimeout(() => setIsOpen(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [isSubscribed, totalTokens])

  if (!session) return null

  const handleClose = () => {
    setIsOpen(false)
    migratedStorage.setPreference("seen_trial_modal", true)
  }

  const handleStartTrial = async () => {
    if (!session?.user) {
      handleClose()
      router.push("/dashboard/subscription")
      return
    }

    try {
      setIsLoading(true)
      
      // Create AbortController for request cancellation
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      // Call the API to start trial
      const response = await fetch('/api/subscriptions/start-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: 'BASIC' // Start with BASIC plan trial
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: "Trial Started!",
          description: "Your 30-day trial has been activated with 5 free credits.",
          variant: "default",
        })
        handleClose()
        
        // Refresh subscription state instead of page reload
        if (refreshSubscription) {
          await refreshSubscription()
        } else {
          // Fallback to page reload only if necessary
          window.location.reload()
        }
      } else {
        toast({
          title: "Trial Failed",
          description: result.message || result.error || "Failed to start trial. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "Request Timeout",
          description: "The request took too long. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "An error occurred while starting your trial.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
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
        <DialogHeader className="px-6 pt-6 pb-4 bg-card border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">Unlock Premium Features</DialogTitle>
              <DialogDescription className="text-muted-foreground">Try our PRO plan with 5 FREE credits</DialogDescription>
            </div>
          </div>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none">
            <X className="h-5 w-5 text-muted-foreground" />
          </DialogClose>
        </DialogHeader>

        {/* Main Content */}
        <div className="px-6 py-4 bg-card">
          <div className="flex flex-col lg:flex-row lg:gap-6">
            {/* Left Column */}
            <div className="flex-1 space-y-4">
              {/* Limited Time Offer */}
              <div className="flex items-center justify-center gap-2 p-2 rounded-md bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Limited Time Offer! Get 20% off any plan!
              </div>

              {/* Coupon Code */}
              <div className="flex flex-col items-center p-4 border border-primary/20 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground mb-2">Use this code at checkout</p>
                <div className="relative w-full max-w-xs">
                  <Input
                    value="AILAUNCH20"
                    readOnly
                    className="text-center text-lg font-bold h-11 bg-background border-primary/30"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full bg-background hover:bg-accent text-primary border-primary/30"
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
                <p className="text-center mt-2 text-xs text-muted-foreground">
                  20% off your first payment - Only in {currentMonth}!
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex-1 space-y-4">
              {/* Features */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">What You'll Get</h3>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted border border-border"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border">
                        {feature.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted border-t">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground text-center">
              Join thousands of satisfied users who have upgraded to PRO!
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="w-full" onClick={handleClose}>
                Maybe Later
              </Button>
              <Button onClick={handleStartTrial} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                {isLoading ? (
                  <Loader2 className="h-4 w-4" />
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
