"use client"

import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { useSessionContext } from '@/hooks/useSessionContext'
import { useEffect } from 'react'
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function CreditCounter() {
  const {
    remainingCredits,
    credits,
    plan,
    hasCredits,
    isSubscribed
  } = useUnifiedSubscription()
  
  const {
    shouldShowCreditWarning,
    markCreditWarningShown
  } = useSessionContext()
  
  const router = useRouter()
  
  const totalCredits = credits || 0
  const usedCredits = totalCredits - remainingCredits
  const usagePercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0
  
  // Determine status color
  const getStatusColor = () => {
    if (usagePercentage >= 90) return 'text-red-600 dark:text-red-400'
    if (usagePercentage >= 80) return 'text-amber-600 dark:text-amber-400'
    return 'text-green-600 dark:text-green-400'
  }
  
  const getStatusBg = () => {
    if (usagePercentage >= 90) return 'bg-red-100 dark:bg-red-900/20'
    if (usagePercentage >= 80) return 'bg-amber-100 dark:bg-amber-900/20'
    return 'bg-green-100 dark:bg-green-900/20'
  }
  
  const getStatusIcon = () => {
    if (usagePercentage >= 90) return <AlertCircle className="w-3 h-3" />
    if (usagePercentage >= 80) return <AlertCircle className="w-3 h-3" />
    return <CheckCircle className="w-3 h-3" />
  }
  
  // Show proactive warning at 80% usage
  useEffect(() => {
    if (usagePercentage >= 80 && shouldShowCreditWarning(80)) {
      // This could trigger a toast notification
      markCreditWarningShown(80)
    }
  }, [usagePercentage, shouldShowCreditWarning, markCreditWarningShown])
  
  // Don't show for unlimited plans
  if (plan === 'PREMIUM' || plan === 'ENTERPRISE') {
    return null
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 font-medium transition-colors",
            getStatusColor()
          )}
        >
          <CreditCard className="w-4 h-4" />
          <span className="hidden sm:inline">
            {remainingCredits} / {totalCredits}
          </span>
          <span className="sm:hidden">
            {remainingCredits}
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Monthly Credits</h4>
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
              getStatusBg(),
              getStatusColor()
            )}>
              {getStatusIcon()}
              {usagePercentage >= 90 ? 'Critical' : usagePercentage >= 80 ? 'Low' : 'Healthy'}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span className="font-medium">
                {usedCredits} / {totalCredits}
              </span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-2"
            />
          </div>
          
          {/* Status Message */}
          <div className="text-sm space-y-2">
            {usagePercentage >= 90 ? (
              <p className="text-red-600 dark:text-red-400">
                ⚠️ You&apos;ve used {Math.round(usagePercentage)}% of your monthly credits.
              </p>
            ) : usagePercentage >= 80 ? (
              <p className="text-amber-600 dark:text-amber-400">
                📊 You&apos;re running low on credits ({remainingCredits} remaining).
              </p>
            ) : (
              <p className="text-muted-foreground">
                ✓ You have {remainingCredits} credits remaining this month.
              </p>
            )}
            
            {/* Plan Info */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Current Plan: <span className="font-medium text-foreground">{plan}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Credits refresh on the 1st of each month
              </p>
            </div>
          </div>
          
          {/* CTA */}
          {usagePercentage >= 80 && (
            <Button
              onClick={() => router.push('/dashboard/subscription')}
              className="w-full bg-warning hover:bg-warning/90"
              size="sm"
            >
              Upgrade for Unlimited
            </Button>
          )}
          
          {usagePercentage < 80 && !isSubscribed && (
            <Button
              onClick={() => router.push('/dashboard/subscription')}
              variant="outline"
              className="w-full"
              size="sm"
            >
              View Plans
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
