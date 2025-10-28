"use client"

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Crown,
  CheckCircle2,
  ArrowRight,
  X
} from 'lucide-react'
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { getPlanConfig, SubscriptionPlanType } from '@/types/subscription-plans'
import { buildFeatureList } from '@/utils/subscription-ui-helpers'

// ============= Types =============

type VariantType = 'inline' | 'modal' | 'page' | 'card'

interface SubscriptionUpgradeProps {
  requiredPlan?: SubscriptionPlanType
  variant?: VariantType
  feature?: string
  onUpgrade?: () => void
  onClose?: () => void
  customMessage?: string
  className?: string
}export default function SubscriptionUpgrade({
  requiredPlan = 'BASIC',
  variant = 'inline',
  feature,
  onUpgrade,
  onClose,
  customMessage,
  className = ''
}: SubscriptionUpgradeProps) {
  const router = useRouter()
  const { plan: currentPlan } = useUnifiedSubscription()

  const planConfig = getPlanConfig(requiredPlan)
  const planFeatures = buildFeatureList(planConfig, false) as string[]
  
  // Simplified feature display
  const displayFeatures = planFeatures.slice(0, 5)

  // Handle upgrade click
  const handleUpgrade = useCallback(() => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      // Default: redirect to subscription page
      router.push('/dashboard/subscription')
    }
  }, [onUpgrade, router])
  
  // Render based on variant
  const renderContent = () => {
    const content = (
      <div className="space-y-4">
        {/* Minimal header with icon */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 border-4 border-blue-500 shadow-[4px_4px_0px_0px_hsl(var(--border))]">
            <Crown className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {customMessage || `Upgrade to ${planConfig.name}`}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ${planConfig.price}/month
            </p>
          </div>
        </div>

        {/* Single CTA Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-blue-600 hover:bg-blue-700 border-4 border-blue-700 shadow-[4px_4px_0px_0px_hsl(var(--border))] text-white"
            size="lg"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          {onClose && variant === 'modal' && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="lg"
              className="px-3"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    )

    // Wrap in appropriate container based on variant
    switch (variant) {
      case 'modal':
        return (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/80"
              onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget && onClose) {
                  onClose()
                }
              }}
            >
              <Card className={`max-w-2xl w-full my-auto max-h-[90vh] overflow-y-auto shadow-2xl ${className}`}>
                <CardContent className="p-6">
                  {content}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        )

      case 'page':
        return (
          <div className={`container max-w-4xl mx-auto py-12 px-4 ${className}`}>
            <Card>
              <CardContent className="p-8">
                {content}
              </CardContent>
            </Card>
          </div>
        )

      case 'card':
        return (
          <Card className={`w-full ${className}`}>
            <CardContent className="p-6">
              {content}
            </CardContent>
          </Card>
        )

      case 'inline':
      default:
        return (
          <div className={`w-full p-6 bg-white dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-800 ${className}`}>
            {content}
          </div>
        )
    }
  }
  
  return renderContent()
}

// ============= Export Named Variants =============

export function SubscriptionUpgradeModal(props: Omit<SubscriptionUpgradeProps, 'variant'>) {
  return <SubscriptionUpgrade {...props} variant="modal" />
}

function SubscriptionUpgradePage(props: Omit<SubscriptionUpgradeProps, 'variant'>) {
  return <SubscriptionUpgrade {...props} variant="page" />
}

function SubscriptionUpgradeCard(props: Omit<SubscriptionUpgradeProps, 'variant'>) {
  return <SubscriptionUpgrade {...props} variant="card" />
}
