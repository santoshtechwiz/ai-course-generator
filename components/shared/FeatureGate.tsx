"use client"

import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Lock, Crown, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useFeatureAccess, type FeatureType } from '@/hooks/useFeatureAccess'
import { SignInPrompt, SubscriptionUpgrade } from '@/components/shared'

interface FeatureGateProps {
  children: ReactNode
  feature: FeatureType
  
  // Partial content options
  showPartialContent?: boolean
  partialContent?: ReactNode
  blurPartialContent?: boolean
  blurIntensity?: number // 1-10 scale (maps to blur-sm, blur-md, blur-lg, etc.)
  
  // Customization
  lockMessage?: string
  lockDescription?: string
  fallback?: ReactNode
  
  // Layout
  variant?: 'inline' | 'modal' | 'card'
  className?: string
}

/**
 * FeatureGate - Universal subscription-aware wrapper component
 * 
 * Automatically handles:
 * - Authentication checks (shows sign-in prompt)
 * - Subscription checks (shows upgrade prompt)
 * - Partial content display with lock overlay
 * - Graceful fallbacks
 * 
 * @example
 * ```tsx
 * <FeatureGate 
 *   feature="course-videos"
 *   showPartialContent={true}
 *   partialContent={<VideoThumbnail />}
 * >
 *   <FullVideoPlayer />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  children,
  feature,
  showPartialContent = false,
  partialContent,
  blurPartialContent = true,
  blurIntensity = 5,
  lockMessage,
  lockDescription,
  fallback,
  variant = 'inline',
  className = ''
}: FeatureGateProps) {
  const { canAccess, reason, requiredPlan, isAuthenticated } = useFeatureAccess(feature)
  
  // Map blur intensity (1-10) to Tailwind classes
  const getBlurClass = () => {
    if (!blurPartialContent) return ''
    if (blurIntensity <= 2) return 'blur-[2px]'
    if (blurIntensity <= 4) return 'blur-sm'
    if (blurIntensity <= 6) return 'blur-md'
    if (blurIntensity <= 8) return 'blur-lg'
    return 'blur-xl'
  }
  
  const blurClass = getBlurClass()
  
  // User has access - render children
  if (canAccess) {
    return <>{children}</>
  }
  
  // Authentication required
  if (reason === 'auth' && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <SignInPrompt
            variant={variant}
            context="feature"
            feature={feature}
            showBenefits={true}
          />
        </CardContent>
      </Card>
    )
  }
  
  // Subscription/Plan upgrade required
  if (reason === 'subscription' || reason === 'expired') {
    // Show partial content with lock overlay
    if (showPartialContent && partialContent) {
      return (
        <div className={`relative overflow-hidden ${className}`}>
          {/* Partial content with blur */}
          <div className={`${blurClass} opacity-50 pointer-events-none select-none`}>
            {partialContent}
          </div>
          
          {/* Lock overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background flex items-center justify-center z-10"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="bg-card/95 backdrop-blur-sm border-2 border-blue-500/30 rounded-xl p-6 shadow-2xl max-w-md mx-4"
            >
              <div className="flex flex-col items-center text-center gap-4 w-full">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2 justify-center">
                      <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      {lockMessage || 'Upgrade Required'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {lockDescription || `Upgrade to ${requiredPlan || 'BASIC'} to unlock this feature`}
                    </p>
                  </div>
                  
                  {/* Engaging benefits */}
                  <div className="flex flex-col gap-2 text-left bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">Full access to all content</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">AI-powered learning insights</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">Progress tracking & certificates</span>
                    </div>
                  </div>
                  
                  <SubscriptionUpgrade
                    variant="inline"
                    requiredPlan={requiredPlan || 'BASIC'}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )
    }
    
    // Show upgrade prompt only
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <SubscriptionUpgrade
            variant={variant}
            requiredPlan={requiredPlan || 'BASIC'}
          />
        </CardContent>
      </Card>
    )
  }
  
  // Credits or other denial reason - show fallback or children with warning
  if (fallback) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * useFeatureGate - Hook version for conditional rendering
 * 
 * @example
 * ```tsx
 * const { canAccess, renderGate } = useFeatureGate('pdf-generation')
 * 
 * if (!canAccess) {
 *   return renderGate()
 * }
 * 
 * return <PDFGenerator />
 * ```
 */
export function useFeatureGate(feature: FeatureType) {
  const accessInfo = useFeatureAccess(feature)
  
  const renderGate = (props?: Partial<Omit<FeatureGateProps, 'children' | 'feature'>>) => {
    return (
      <FeatureGate feature={feature} {...props}>
        <></>
      </FeatureGate>
    )
  }
  
  return {
    ...accessInfo,
    renderGate
  }
}

export default FeatureGate
