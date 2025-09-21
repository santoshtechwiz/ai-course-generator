"use client"

// This file provides backwards compatibility - use @/modules/auth/hooks/useSubscription for new code
import { useSubscription as useMainSubscription } from '@/modules/auth/hooks/useSubscription'
import { useToast } from '@/hooks'
import type { SubscriptionData, SubscriptionPlanType, SubscriptionStatusType } from '@/types/subscription'

export type UseSubscriptionOptions = {
  allowPlanChanges?: boolean;
  allowDowngrades?: boolean;
  onSubscriptionSuccess?: (result: any) => void;
  onSubscriptionError?: (error: any) => void;
  skipInitialFetch?: boolean;
  lazyLoad?: boolean;
  validateOnMount?: boolean;
};

export default function useSubscription(options: UseSubscriptionOptions = {}) {
  const { toast } = useToast()
  
  // Use the main subscription hook
  const {
    subscription,
    hasActiveSubscription,
    hasCredits,
    canCreateQuizOrCourse,
    isAuthenticated,
    user,
    refreshSubscription,
    clearError
  } = useMainSubscription()

  // Provide backwards compatible interface
  return {
    // Core data
    subscription,
    user,
    
    // Permissions
    hasActiveSubscription,
    hasCredits,
    canCreateQuizOrCourse,
    canCreateQuiz: canCreateQuizOrCourse,
    canCreateCourse: canCreateQuizOrCourse,
    
    // Status
    isAuthenticated,
    isLoading: false,
    isExpired: subscription?.status === 'EXPIRED',
    
    // Actions
    refreshSubscription,
    clearError,
    
    // Toast helper
    showSuccess: (message: string) => toast({ title: "Success", description: message }),
    showError: (message: string) => toast({ title: "Error", description: message, variant: "destructive" })
  }
}

// Re-export the main hooks for convenience
export {
  useSubscription as useMainSubscription,
  useSubscriptionPermissions,
  useSubscriptionTracking
} from '@/modules/auth/hooks/useSubscription'