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
      <DialogContent className="sm:max-w-md border-4 border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-neo)]">
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 rounded-none border-2 border-[var(--color-border)] bg-[var(--color-bg)] w-8 h-8 flex items-center justify-center shadow-[2px_2px_0_var(--color-border)] hover:bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
        >
          <X className="h-4 w-4 text-[var(--color-text)]" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="text-center space-y-4 pt-6">
          <div className="mx-auto w-20 h-20 bg-[var(--color-primary)] rounded-none flex items-center justify-center border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)]">
            <Crown className="w-10 h-10 text-[var(--color-bg)]" />
          </div>
          <div className="space-y-3">
            <DialogTitle className="text-xl font-black text-[var(--color-text)] uppercase tracking-tight">
              Upgrade Required
            </DialogTitle>
            <DialogDescription className="text-base text-[var(--color-text)]/70 font-medium">
              {feature
                ? `"${feature}" requires ${requiredPlanConfig.name} plan`
                : `This feature requires ${requiredPlanConfig.name} plan`
              }
              {currentPlan && (
                <span className="block mt-2 text-sm font-normal px-3 py-1 bg-[var(--color-bg)] text-[var(--color-text)] border-2 border-[var(--color-border)] inline-block">
                  Current: {currentPlan}
                </span>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-[var(--color-bg)] border-4 border-[var(--color-border)] shadow-[var(--shadow-neo)]">
            <h4 className="font-black text-lg mb-3 flex items-center text-[var(--color-text)]">
              <Zap className="w-5 h-5 mr-2 text-[var(--color-primary)]" />
              {requiredPlanConfig.name} Includes:
            </h4>
            <ul className="space-y-2">
              {getPlanBenefits().map((benefit, index) => (
                <li key={index} className="flex items-start text-sm font-medium text-[var(--color-text)]/90">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Badge */}
          <div className="bg-[var(--color-primary)] border-4 border-[var(--color-border)] py-2 px-4 text-center shadow-[var(--shadow-neo)]">
            <div className="flex items-center justify-center gap-2 font-black text-[var(--color-bg)] uppercase text-sm tracking-wide">
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
            className="flex-1 border-4 border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] font-bold hover:bg-[var(--color-card)] transition-all duration-200 shadow-[var(--shadow-neo)] hover:shadow-[2px_2px_0_var(--color-border)] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-[var(--color-primary)] text-[var(--color-bg)] font-black border-4 border-[var(--color-border)] hover:bg-[var(--color-primary)]/90 transition-all duration-200 shadow-[var(--shadow-neo)] hover:shadow-[6px_6px_0_var(--color-border)] active:shadow-[2px_2px_0_var(--color-border)] active:translate-x-1 active:translate-y-1"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}