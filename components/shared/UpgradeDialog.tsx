"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown, ArrowLeft, Sparkles, Zap, CheckCircle2, X } from "lucide-react"
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
      <DialogContent className="sm:max-w-md border-[3px] border-foreground bg-background shadow-[8px_8px_0px_0px_rgb(0,0,0)] rounded-none">
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-2 border-foreground bg-background w-8 h-8 flex items-center justify-center"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="text-center space-y-4 pt-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-[3px] border-foreground shadow-[4px_4px_0px_0px_rgb(0,0,0)]">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-3">
            <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">
              Upgrade Required
            </DialogTitle>
            <DialogDescription className="text-base text-foreground/80 font-medium">
              {feature
                ? `"${feature}" requires ${requiredPlanConfig.name} plan`
                : `This feature requires ${requiredPlanConfig.name} plan`
              }
              {currentPlan && (
                <span className="block mt-2 text-sm font-normal px-3 py-1 bg-amber-100 text-amber-900 border-2 border-amber-900 inline-block">
                  Current: {currentPlan}
                </span>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-blue-50 border-[3px] border-foreground shadow-[4px_4px_0px_0px_rgb(0,0,0)]">
            <h4 className="font-black text-lg mb-3 flex items-center text-foreground">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              {requiredPlanConfig.name} Includes:
            </h4>
            <ul className="space-y-2">
              {getPlanBenefits().map((benefit, index) => (
                <li key={index} className="flex items-start text-sm font-medium text-foreground/90">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Badge */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 border-[3px] border-foreground py-2 px-4 text-center">
            <div className="flex items-center justify-center gap-2 font-black text-foreground uppercase text-sm tracking-wide">
              <Sparkles className="w-4 h-4" />
              Most Popular Plan
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="neutral"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-[3px] border-foreground bg-background text-foreground font-bold hover:bg-foreground hover:text-background transition-all duration-200 shadow-[4px_4px_0px_0px_rgb(0,0,0)] hover:shadow-[2px_2px_0px_0px_rgb(0,0,0)] active:shadow-[0px_0px_0px_0px_rgb(0,0,0)] active:translate-x-1 active:translate-y-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-foreground font-black border-[3px] border-foreground hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 shadow-[4px_4px_0px_0px_rgb(0,0,0)] hover:shadow-[6px_6px_0px_0px_rgb(0,0,0)] active:shadow-[2px_2px_0px_0px_rgb(0,0,0)] active:translate-x-1 active:translate-y-1"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}