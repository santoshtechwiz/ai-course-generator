"use client"

import { useState, useEffect } from 'react'
import { AlertCircle, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

/**
 * Credit Guidance Banner
 * 
 * Shows contextual upgrade guidance for users who have exhausted their credits.
 * Features:
 * - Non-blocking (dismissible)
 * - Session-persisted dismissal
 * - Only shows for FREE/STARTER users with 0 credits
 * - Clear upgrade path with plan comparison
 */
export function CreditGuidanceBanner() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Handle client-side only rendering
  useEffect(() => {
    setIsClient(true)
    // Check if dismissed in this session
    const wasDismissed = sessionStorage.getItem('credit-banner-dismissed') === 'true'
    setDismissed(wasDismissed)
  }, [])

  // Don't render during SSR or while loading
  if (!isClient || status === 'loading') return null

  // Don't show if:
  // - Not logged in
  // - Already dismissed
  // - Has credits remaining
  // - Premium/Enterprise (unlimited)
  if (!session?.user) return null
  if (dismissed) return null

  const plan = (session.user.userType || 'FREE').toUpperCase()
  const credits = session.user.credits || 0

  // Only show for users with 0 credits on limited plans
  if (credits > 0 || plan === 'PREMIUM' || plan === 'ENTERPRISE') {
    return null
  }

  const handleDismiss = () => {
    sessionStorage.setItem('credit-banner-dismissed', 'true')
    setDismissed(true)
  }

  const handleUpgrade = () => {
    // Navigate to subscription page with context
    router.push('/dashboard/subscription?reason=credits_exhausted&current_plan=' + plan.toLowerCase())
    handleDismiss()
  }

  const handleLearnMore = () => {
    // Navigate to subscription page to compare plans
    router.push('/dashboard/subscription#plans')
    handleDismiss()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-6"
      >
        <div className="bg-warning/10 border-l-3 border-warning rounded-sm shadow-[4px_4px_0px_0px_var(--border)] overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-sm bg-warning border-2 border-border flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-warning-foreground" />
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-base text-amber-900 dark:text-amber-100">
                    You've used all your monthly credits
                  </h4>
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3 leading-relaxed">
                  You're currently on the <span className="font-semibold px-1.5 py-0.5 bg-amber-200/50 dark:bg-amber-800/50 rounded">{plan}</span> plan. 
                  Upgrade to <span className="font-semibold text-amber-900 dark:text-amber-100">Premium</span> for <span className="font-semibold">unlimited</span> quiz and course creation, 
                  advanced AI models, and priority support. Your work is saved and ready!
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    onClick={handleUpgrade}
                    className="bg-amber-500 hover:bg-amber-600 border-4 border-amber-600 shadow-[4px_4px_0px_0px_hsl(var(--border))] text-white font-medium"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Upgrade to Premium
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLearnMore}
                    className="border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    Compare Plans
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors p-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/30"
                aria-label="Dismiss banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Bottom accent */}
          <div className="h-1 bg-warning" />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
