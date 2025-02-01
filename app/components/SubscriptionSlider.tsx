"use client"

import type React from "react"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import useSubscriptionStore from "@/store/useSubscriptionStore"
import { Lock, Unlock } from "lucide-react"

interface SubscriptionSliderProps {
  value: number
  onValueChange: (value: number) => void
  ariaLabel?: string
}

export const SubscriptionSlider: React.FC<SubscriptionSliderProps> = ({
  value,
  onValueChange,
  ariaLabel = "Select number of questions",
}) => {
  const { subscriptionStatus } = useSubscriptionStore()

  const subscriptionLimits = {
    FREE: 3,
    BASIC: 5,
    PRO: 15,
    PREMIUM: 30,
  }

  const getMaxQuestions = () => {
    return subscriptionStatus?.subscriptionPlan
      ? subscriptionLimits[subscriptionStatus.subscriptionPlan]
      : subscriptionLimits.FREE
  }

  const maxQuestions = getMaxQuestions()
  const isMaxPlan = subscriptionStatus?.subscriptionPlan === "PREMIUM"

  const getNextPlan = () => {
    const plans = Object.keys(subscriptionLimits)
    const currentIndex = plans.indexOf(subscriptionStatus?.subscriptionPlan || "FREE")
    return plans[currentIndex + 1]
  }

  const nextPlan = getNextPlan()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={isMaxPlan ? "secondary" : "outline"} className="cursor-help">
                {isMaxPlan ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                {subscriptionStatus?.subscriptionPlan || "FREE"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Your current subscription plan</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-sm font-medium">
          {value} / {maxQuestions} questions
        </span>
      </div>
      <Slider
        id="questionCount"
        min={1}
        max={maxQuestions}
        step={1}
        value={[value]}
        onValueChange={(values) => onValueChange(values[0])}
        className="flex-grow"
        aria-label={ariaLabel}
      />
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>1</span>
        <span>{maxQuestions}</span>
      </div>
      {!isMaxPlan && (
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground mb-2">Need more questions? Upgrade your plan!</p>
          <Button variant="outline" size="sm">
            Upgrade to {nextPlan}
          </Button>
        </div>
      )}
    </div>
  )
}

