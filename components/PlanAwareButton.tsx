"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import type { ButtonProps } from "@/components/ui/button"

interface PlanAwareButtonProps extends ButtonProps {
  requiredPlan?: "FREE" | "BASIC" | "PRO" | "ULTIMATE"
  fallbackHref?: string
  onPlanRequired?: () => void
  children: React.ReactNode
}

export default function PlanAwareButton({
  requiredPlan = "FREE",
  fallbackHref = "/dashboard/subscription",
  onPlanRequired,
  children,
  ...props
}: PlanAwareButtonProps) {
  const { data: session } = useSession()
  const { subscriptionStatus } = useSubscriptionStore()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Function to check if the user's plan meets the requirements
  const meetsRequirement = () => {
    if (!session?.user) return false

    // If no subscription status is available, default to not meeting requirements
    if (!subscriptionStatus) return requiredPlan === "FREE"

    const currentPlan = subscriptionStatus.subscriptionPlan
    const isActive = subscriptionStatus.isSubscribed

    // If the subscription is not active, only allow FREE features
    if (!isActive && requiredPlan !== "FREE") return false

    // Plan hierarchy for comparison
    const planHierarchy = {
      FREE: 0,
      BASIC: 1,
      PRO: 2,
      ULTIMATE: 3,
    }

    // Check if current plan is sufficient
    return planHierarchy[currentPlan] >= planHierarchy[requiredPlan]
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!session?.user) {
      e.preventDefault()
      setIsLoading(true)

      toast({
        title: "Authentication Required",
        description: "Please sign in to access this feature",
        variant: "destructive",
      })

      setTimeout(() => {
        router.push("/api/auth/signin")
        setIsLoading(false)
      }, 1500)
      return
    }

    if (!meetsRequirement()) {
      e.preventDefault()
      setIsLoading(true)

      if (onPlanRequired) {
        onPlanRequired()
      } else {
        toast({
          title: "Plan Upgrade Required",
          description: `This feature requires the ${requiredPlan} plan or higher`,
          variant: "destructive",
        })

        setTimeout(() => {
          router.push(fallbackHref)
          setIsLoading(false)
        }, 1500)
      }
      return
    }

    // If the original button had an onClick handler, call it
    if (props.onClick) {
      props.onClick(e)
    }
  }

  return (
    <Button {...props} onClick={handleClick} disabled={isLoading || props.disabled}>
      {children}
    </Button>
  )
}
