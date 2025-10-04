"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Star, Crown, Zap, ArrowRight } from 'lucide-react'
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import type { SubscriptionPlanType } from '@/types/subscription'

interface ImprovedAuthDialogProps {
  isOpen: boolean
  onClose: () => void
  targetPlan?: SubscriptionPlanType
  onProceed?: () => void
}

export function ImprovedAuthDialog({ 
  isOpen, 
  onClose, 
  targetPlan = 'BASIC',
  onProceed 
}: ImprovedAuthDialogProps) {
  const { subscription, plan } = useUnifiedSubscription()
  const currentPlan = (plan || 'FREE') as SubscriptionPlanType
  const typedTargetPlan = targetPlan as SubscriptionPlanType
  const isSubscribed = subscription?.isSubscribed || false
  
  const planIcons: Record<SubscriptionPlanType, React.ReactElement> = {
    FREE: <CheckCircle className="w-5 h-5" />,
    BASIC: <Star className="w-5 h-5" />,
    PREMIUM: <Crown className="w-5 h-5" />,
    ENTERPRISE: <Zap className="w-5 h-5" />
  }
  
  const planNames: Record<SubscriptionPlanType, string> = {
    FREE: 'Free Plan',
    BASIC: 'Basic Plan',
    PREMIUM: 'Premium Plan', 
    ENTERPRISE: 'Enterprise Plan'
  }
  
  const planFeatures: Record<SubscriptionPlanType, string[]> = {
    FREE: ['3 tokens/month', 'Basic features', 'Community support'],
    BASIC: ['25 tokens/month', 'Enhanced features', 'Email support'],
    PREMIUM: ['100 tokens/month', 'Advanced features', 'Priority support'],
    ENTERPRISE: ['250 tokens/month', 'All features', 'Dedicated support']
  }
  
  // Check if user is already on the target plan or higher
  const planHierarchy: Record<SubscriptionPlanType, number> = { FREE: 0, BASIC: 1, PREMIUM: 2, ENTERPRISE: 3 }
  const currentLevel = planHierarchy[currentPlan] || 0
  const targetLevel = planHierarchy[typedTargetPlan] || 0
  const isUpgrade = targetLevel > currentLevel
  const isSamePlan = currentPlan === typedTargetPlan
  const isDowngrade = targetLevel < currentLevel

  const getDialogContent = () => {
    if (!isSubscribed) {
      return {
        title: `Welcome! Join ${planNames[typedTargetPlan]} 🚀`,
        description: `Get started with ${planNames[typedTargetPlan]} to unlock amazing features and boost your learning experience.`,
        variant: 'upgrade' as const
      }
    }
    
    if (isSamePlan) {
      return {
        title: `You're Already on ${planNames[currentPlan]}! 🎉`,
        description: `Great choice! You're already enjoying all the benefits of ${planNames[currentPlan]}. Keep learning and creating amazing content!`,
        variant: 'current' as const
      }
    }
    
    if (isUpgrade) {
      return {
        title: `Upgrade to ${planNames[typedTargetPlan]}? ⬆️`,
        description: `Take your experience to the next level with ${planNames[typedTargetPlan]}. Get more tokens and unlock advanced features!`,
        variant: 'upgrade' as const
      }
    }
    
    if (isDowngrade) {
      return {
        title: `Downgrade Notice 📉`,
        description: `You're currently on ${planNames[currentPlan]}. Switching to ${planNames[typedTargetPlan]} will reduce your available features.`,
        variant: 'downgrade' as const
      }
    }
    
    return {
      title: `Plan Information`,
      description: `Learn more about ${planNames[typedTargetPlan]} features.`,
      variant: 'info' as const
    }
  }

  const content = getDialogContent()
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {planIcons[typedTargetPlan]}
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Current Plan Status */}
          {isSubscribed && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Plan:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {planIcons[currentPlan]}
                  {planNames[currentPlan]}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {subscription.available || 0} tokens available
              </div>
            </div>
          )}
          
          {/* Target Plan Features */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              {planIcons[typedTargetPlan]}
              {planNames[typedTargetPlan]} Features
            </h4>
            <ul className="space-y-2">
              {planFeatures[typedTargetPlan].map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {content.variant === 'current' ? 'Got it!' : 'Cancel'}
            </Button>
            
            {content.variant !== 'current' && (
              <Button 
                onClick={() => {
                  onProceed?.()
                  onClose()
                }} 
                className="flex-1 flex items-center gap-2"
                variant={content.variant === 'downgrade' ? 'destructive' : 'default'}
              >
                {content.variant === 'upgrade' && 'Upgrade Now'}
                {content.variant === 'downgrade' && 'Downgrade'}
                {content.variant === 'info' && 'Learn More'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImprovedAuthDialog