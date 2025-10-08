/**
 * Simplified Route Protection Hook
 * Client-side fallback for edge cases - server middleware handles most protection
 */

"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFeatureAccess } from './useFeatureAccess'
import type { FeatureType } from '@/lib/featureAccess'

export interface RouteProtectionConfig {
  feature: FeatureType
  redirectTo?: string
  allowPublicAccess?: boolean
}

export interface RouteProtectionState {
  isChecking: boolean
  isAllowed: boolean
  redirectUrl: string | null
  reason: 'auth' | 'subscription' | 'credits' | 'expired' | null
}

/**
 * useRouteProtection - Simplified client-side route protection
 * Note: Server-side middleware should handle most cases.
 */
export function useRouteProtection(config: RouteProtectionConfig): RouteProtectionState {
  const router = useRouter()
  const { canAccess, reason } = useFeatureAccess(config.feature)
  
  const [state, setState] = useState<RouteProtectionState>({
    isChecking: true,
    isAllowed: false,
    redirectUrl: null,
    reason: null
  })
  
  useEffect(() => {
    if (config.allowPublicAccess) {
      setState({
        isChecking: false,
        isAllowed: true,
        redirectUrl: null,
        reason: null
      })
      return
    }
    
    if (canAccess) {
      setState({
        isChecking: false,
        isAllowed: true,
        redirectUrl: null,
        reason: null
      })
    } else {
      const redirectUrl = config.redirectTo || '/dashboard/explore'
      
      setState({
        isChecking: false,
        isAllowed: false,
        redirectUrl,
        reason: reason as any
      })
      
      // Client-side fallback redirect
      console.warn('[RouteProtection] Client-side fallback redirect - server protection may have failed')
      router.replace(redirectUrl)
    }
    
  }, [canAccess, reason, config.allowPublicAccess, config.redirectTo, router])
  
  return state
}

export default useRouteProtection
