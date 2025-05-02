"use client"

import type React from "react"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Lock, Unlock } from "lucide-react"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"
import type { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"
import { useSubscription } from "../hooks/use-subscription"

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
  const { data:subscriptionStatus } = useSubscription()

  const currentPlan =
    SUBSCRIPTION_PLANS.find((plan) => plan.id === subscriptionStatus?.subscriptionPlan) || SUBSCRIPTION_PLANS[0]
  const maxQuestions = currentPlan.limits.maxQuestionsPerQuiz
  const isMaxPlan = currentPlan.name === "ULTIMATE"

  const getNextPlan = (): SubscriptionPlanType => {
    const currentIndex = SUBSCRIPTION_PLANS.findIndex((plan) => plan.name === currentPlan.name)
    return SUBSCRIPTION_PLANS[currentIndex + 1]?.id || currentPlan.id
  }

  const nextPlan = getNextPlan()

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={isMaxPlan ? "secondary" : "default"}
                className={`cursor-help ${isMaxPlan ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
              >
                {isMaxPlan ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                {currentPlan.name}
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
        className="w-full"
        aria-label={ariaLabel}
      />
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>1</span>
        <span>{maxQuestions}</span>
      </div>
      {!isMaxPlan && (
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground mb-2">Need more questions? Upgrade your plan!</p>
          <Button variant="outline" size="sm" className="w-full">
            Upgrade to {nextPlan}
          </Button>
        </div>
      )}
    </div>
  )
}
