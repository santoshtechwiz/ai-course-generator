"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

export const useSubscription = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const session=useSession();
  const handleSubscribe = async (planName: string, duration: number, promoCode?: string, promoDiscount?: number) => {
    setIsLoading(true)
    try {
      // Get the current user ID
      const userId =session?.data?.user?.id;

      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          planName,
          duration,
          promoCode,
          promoDiscount,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to create subscription")
      }

      // Check if we have a checkout URL
      if (result.url) {
        toast({
          title: "Redirecting to Checkout",
          description: "You'll be redirected to complete your subscription payment.",
          variant: "default",
        })

        // Redirect to the checkout URL
        window.location.href = result.url
        return true
      } else if (result.sessionId) {
        // Fallback if only sessionId is returned
        console.warn("No checkout URL returned, but session ID is available:", result.sessionId)
        toast({
          title: "Checkout Ready",
          description: "Your checkout session has been created. Please wait...",
          variant: "default",
        })
        return true
      }

      return false
    } catch (error: any) {
      console.error("Error subscribing:", error)
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const cancelSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to cancel subscription")
      }

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully",
        variant: "default",
      })

      return true
    } catch (error: any) {
      console.error("Error cancelling subscription:", error)
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resumeSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to resume subscription")
      }

      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been resumed successfully",
        variant: "default",
      })

      return true
    } catch (error: any) {
      console.error("Error resuming subscription:", error)
      toast({
        title: "Resume Failed",
        description: error.message || "Failed to resume subscription",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { handleSubscribe, cancelSubscription, resumeSubscription, isLoading }
}

