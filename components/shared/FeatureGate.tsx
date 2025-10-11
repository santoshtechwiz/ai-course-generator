"use client"

import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Lock, Crown, Check, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import type { FeatureType } from '@/lib/featureAccess'
import { SignInPrompt, SubscriptionUpgrade } from '@/components/shared'

interface FeatureGateProps {
  children: ReactNode
  feature: FeatureType
  
  // Partial content options
  showPartialContent?: boolean
  partialContent?: ReactNode
  blurPartialContent?: boolean
  blurIntensity?: number // 1-10 scale (maps to blur-sm, blur-md, blur-lg, etc.)
  
  // Preview control (new)
  previewRatio?: number // 0-1 scale (0.5 = show 50% of content)
  minPreviewPx?: number // Minimum preview height in pixels
  previewFadeRatio?: number // Where to start fade (0-1)
  blur?: boolean // Alias for blurPartialContent (backward compat)
  
  // Overlay customization (new)
  overlayPlacement?: 'over' | 'below' // Position of lock overlay
  overlayFullWidth?: boolean // Full width overlay or centered card
  hideOverlay?: boolean // Hide overlay completely (just show blur)
  
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
  previewRatio = 0.5,
  minPreviewPx = 200,
  previewFadeRatio = 0.4,
  blur,
  overlayPlacement = 'over',
  overlayFullWidth = true,
  hideOverlay = false,
  lockMessage,
  lockDescription,
  fallback,
  variant = 'inline',
  className = ''
}: FeatureGateProps) {
  const accessInfo = useFeatureAccess(feature)
  const { canAccess, reason, requiredPlan } = accessInfo
  const isAuthenticated = 'isAuthenticated' in accessInfo ? accessInfo.isAuthenticated : false
  
  // Backward compatibility: blur prop overrides blurPartialContent
  const shouldBlur = blur !== undefined ? blur : blurPartialContent
  
  // Map blur intensity (1-10) to Tailwind classes
  const getBlurClass = () => {
    if (!shouldBlur) return ''
    if (blurIntensity <= 2) return 'blur-[2px]'
    if (blurIntensity <= 4) return 'blur-sm'
    if (blurIntensity <= 6) return 'blur-md'
    if (blurIntensity <= 8) return 'blur-lg'
    return 'blur-xl'
  }
  
  const blurClass = getBlurClass()
  
  // Calculate preview height percentage
  const previewHeightPercent = Math.max(0, Math.min(100, previewRatio * 100))
  const lockedHeightPercent = 100 - previewHeightPercent
  
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
            callbackUrl={typeof window !== 'undefined' ? window.location.href : undefined}
          />
        </CardContent>
      </Card>
    )
  }
  
  // Subscription/Plan upgrade required
  if (reason === 'subscription' || reason === 'expired') {
    // Show partial content with lock overlay
    if (showPartialContent && (partialContent || children)) {
      const contentToShow = partialContent || children
      
      return (
        <div className={`relative overflow-hidden w-full ${className}`}>
          {/* Container with proper stacking - full width */}
          <div className="relative min-h-[600px] w-full">
            {/* Top preview % - Clear visible content - z-[10] HIGHEST */}
            <div 
              className="relative z-[10] w-full" 
              style={{ 
                height: `${previewHeightPercent}%`, 
                minHeight: `${minPreviewPx}px` 
              }}
            >
              {contentToShow}
            </div>
            
            {/* Bottom locked % - Enhanced glassmorphic blur with lock overlay */}
            <div className="relative w-full" style={{ minHeight: `${Math.max(300, 600 - minPreviewPx)}px` }}>
              {/* Enhanced blurred background with stronger glassmorphic effect - z-[1] */}
              <div className={`${blurClass} opacity-40 pointer-events-none select-none absolute inset-0 z-[1] backdrop-blur-xl`}>
                <div style={{ paddingTop: `${minPreviewPx}px` }}>
                  {contentToShow}
                </div>
              </div>
              
              {/* Lock overlay with enhanced glassmorphic effect - z-[5] */}
              {!hideOverlay && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute inset-0 z-[5] flex items-center justify-center ${
                    overlayPlacement === 'below' 
                      ? 'bg-gradient-to-t from-background via-background/90 to-background/60' 
                      : 'bg-gradient-to-b from-background/50 via-background/85 to-background'
                  } backdrop-blur-md`}
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ duration: 0.4, type: 'spring' }}
                    className={`backdrop-blur-xl bg-card/98 border-2 border-primary/40 rounded-2xl p-4 md:p-6 shadow-2xl relative z-[3] ${
                      overlayFullWidth ? 'w-full max-w-2xl mx-4' : 'max-w-md mx-4'
                    }`}
                  >
                  <div className="flex flex-col items-center text-center gap-4 w-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/30 via-blue-500/25 to-cyan-500/30 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 backdrop-blur-sm border border-primary/20">
                      <Lock className="h-8 w-8 text-primary drop-shadow-lg" />
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
                  
                    {/* Engaging benefits with enhanced glassmorphic styling */}
                    <div className="flex flex-col gap-2 text-left bg-background/60 backdrop-blur-md rounded-xl p-4 border border-primary/20 shadow-inner">
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
              )}
            </div>
          </div>
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
