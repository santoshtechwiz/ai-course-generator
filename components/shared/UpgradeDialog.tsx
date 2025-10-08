"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown, ArrowLeft, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import type { SubscriptionPlanType } from "@/types/subscription-plans"
import { getPlanConfig } from "@/types/subscription-plans"

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requiredPlan: SubscriptionPlanType
  currentPlan?: string
  feature?: string
}

export function UpgradeDialog({ 
  open, 
  onOpenChange, 
  requiredPlan, 
  currentPlan,
  feature 
}: UpgradeDialogProps) {
  const router = useRouter()
  const requiredPlanConfig = getPlanConfig(requiredPlan)

  const getPlanBenefits = () => {
    const benefits = [
      `${requiredPlanConfig.monthlyCredits} monthly credits`,
      requiredPlanConfig.maxQuestionsPerQuiz === 'unlimited' 
        ? 'Unlimited questions per quiz' 
        : `Up to ${requiredPlanConfig.maxQuestionsPerQuiz} questions per quiz`,
      `${requiredPlanConfig.aiAccuracy} AI accuracy`
    ]

    if (requiredPlanConfig.pdfDownloads) benefits.push('PDF downloads and generation')
    if (requiredPlanConfig.fillInBlanks) benefits.push('Fill-in-the-blank quizzes')
    if (requiredPlanConfig.openEndedQuestions) benefits.push('Open-ended essay questions')
    if (requiredPlanConfig.codeQuiz) benefits.push('Advanced coding challenges')
    if (requiredPlanConfig.prioritySupport) benefits.push('Priority customer support')

    return benefits
  }

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push('/dashboard/subscription')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold">Upgrade Required</DialogTitle>
            <DialogDescription className="mt-2">
              {feature 
                ? `${feature} requires a ${requiredPlanConfig.name} plan or higher.`
                : `This feature requires a ${requiredPlanConfig.name} plan or higher.`
              }
              {currentPlan && (
                <span className="block mt-1 text-sm text-muted-foreground">
                  Current plan: {currentPlan}
                </span>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg border">
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              What you get with {requiredPlanConfig.name}:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {getPlanBenefits().map((benefit, index) => (
                <li key={index}>• {benefit}</li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}