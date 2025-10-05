import { useMemo } from "react"
import { useAuth } from "@/modules/auth"
import { useUnifiedSubscription } from "@/hooks/useUnifiedSubscription"
import { getPlanConfig, type SubscriptionPlanType } from "@/types/subscription-plans"

/**
 * Clean Quiz Plan Hook - Uses centralized subscription data
 * No duplicate logic, single source of truth
 */

export interface QuizPlanData {
  isLoggedIn: boolean
  isLoading: boolean
  currentPlan: SubscriptionPlanType
  isSubscribed: boolean
  credits: number
  hasCredits: boolean
  maxQuestions: number | 'unlimited'
  planName: string
  canCreateQuiz: boolean
  // Feature checks - directly from plan config
  canUseMCQ: boolean
  canUseFillBlanks: boolean
  canUseOpenEnded: boolean
  canUseCodeQuiz: boolean
  canUseVideoQuiz: boolean
  canDownloadPDF: boolean
  hasPrioritySupport: boolean
}

export function useQuizPlan(requiredCredits: number = 1): QuizPlanData {
  const { isAuthenticated, isLoading } = useAuth()
  const { 
    subscription, 
    plan, 
    hasCredits: hasEnoughCredits,
    isExpired 
  } = useUnifiedSubscription()
  
  return useMemo(() => {
    // Get current plan (defaults to FREE)
    const currentPlan = (plan || "FREE") as SubscriptionPlanType
    const planConfig = getPlanConfig(currentPlan)
    
    // Get subscription status
    const isSubscribed = subscription?.isSubscribed || false
    const credits = Math.max(0, (subscription?.credits || 0) - (subscription?.tokensUsed || 0))
    const hasCredits = credits >= requiredCredits
    
    // Check if user can create quiz
    const canCreateQuiz = isAuthenticated && hasCredits && !isLoading && !isExpired

    return {
      // Auth & Status
      isLoggedIn: isAuthenticated,
      isLoading,
      currentPlan,
      isSubscribed,
      credits,
      hasCredits,
      
      // Limits
      maxQuestions: planConfig.maxQuestionsPerQuiz,
      
      // Display
      planName: planConfig.name,
      
      // Actions
      canCreateQuiz,
      
      // Feature Flags - directly from plan config (no duplication!)
      canUseMCQ: planConfig.mcqGenerator,
      canUseFillBlanks: planConfig.fillInBlanks,
      canUseOpenEnded: planConfig.openEndedQuestions,
      canUseCodeQuiz: planConfig.codeQuiz,
      canUseVideoQuiz: planConfig.videoQuiz,
      canDownloadPDF: planConfig.pdfDownloads,
      hasPrioritySupport: planConfig.prioritySupport,
    }
  }, [isAuthenticated, isLoading, subscription, plan, requiredCredits, hasEnoughCredits, isExpired])
}

export default useQuizPlan
