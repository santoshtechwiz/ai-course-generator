import { useSession } from "next-auth/react"
import { useAppSelector } from "@/store"
import { selectSubscription } from "@/store/slices/subscription-slice"

import { useMemo, useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation" // Fixed: next/router to next/navigation
import { useToast } from "@/hooks" // Fixed: import toast properly
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"
import useAuth from "./use-auth"

export type PlanType = "FREE" | "BASIC" | "PRO" | "ULTIMATE"

interface QuizPlanConfig {
  maxQuestions: Record<PlanType, number>
  maxQuizzes: Record<PlanType, number>
}

// Use subscription plan limits from the centralized subscription-plans.ts
const DEFAULT_CONFIG: QuizPlanConfig = {
  maxQuestions: {
    FREE: SUBSCRIPTION_PLANS.find(plan => plan.id === "FREE")?.limits.maxQuestionsPerQuiz || 10,
    BASIC: SUBSCRIPTION_PLANS.find(plan => plan.id === "BASIC")?.limits.maxQuestionsPerQuiz || 15,
    PRO: SUBSCRIPTION_PLANS.find(plan => plan.id === "PRO")?.limits.maxQuestionsPerQuiz || 30,
    ULTIMATE: SUBSCRIPTION_PLANS.find(plan => plan.id === "ULTIMATE")?.limits.maxQuestionsPerQuiz || 50,
  },
  maxQuizzes: {
    FREE: SUBSCRIPTION_PLANS.find(plan => plan.id === "FREE")?.limits.maxCoursesPerMonth || 2,
    BASIC: SUBSCRIPTION_PLANS.find(plan => plan.id === "BASIC")?.limits.maxCoursesPerMonth || 10,
    PRO: SUBSCRIPTION_PLANS.find(plan => plan.id === "PRO")?.limits.maxCoursesPerMonth || 30,
    ULTIMATE: SUBSCRIPTION_PLANS.find(plan => plan.id === "ULTIMATE")?.limits.maxCoursesPerMonth || 100,
  },
}

export interface QuizPlanData {
  isLoggedIn: boolean
  isLoading: boolean
  currentPlan: PlanType
  isSubscribed: boolean
  credits: number
  hasCredits: boolean
  maxQuestions: number
  maxQuizzes: number
  planName: string
  canCreateQuiz: boolean
  getRequiredPlanForAction: (action: 'create' | 'edit' | 'advanced') => PlanType
  meetsPlanRequirement: (requiredPlan: PlanType) => boolean
  availableFeatures: string[]
  tokensPerPlan: Record<PlanType, number>
}

// Map of feature ID to required plan
const FEATURE_PLAN_REQUIREMENTS: Record<string, PlanType> = {
  'mcq-generator': 'FREE',
  'fill-blanks': 'FREE',
  'open-ended': 'BASIC',
  'code-quiz': 'BASIC',
  'video-quiz': 'PRO',
  'pdf-downloads': 'FREE',
  'ai-accuracy': 'PRO',
}

export function useQuizPlan(requiredCredits: number = 1, config?: Partial<QuizPlanConfig>): QuizPlanData {
  const { data: session, status: sessionStatus } = useSession()
  const { user, isAuthenticated, status: authStatus } = useAuth()
  const subscription = useAppSelector(selectSubscription)
  
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config])

  // Get tokens available per plan
  const tokensPerPlan = useMemo(() => {
    return {
      FREE: SUBSCRIPTION_PLANS.find(plan => plan.id === "FREE")?.tokens || 5,
      BASIC: SUBSCRIPTION_PLANS.find(plan => plan.id === "BASIC")?.tokens || 60,
      PRO: SUBSCRIPTION_PLANS.find(plan => plan.id === "PRO")?.tokens || 250,
      ULTIMATE: SUBSCRIPTION_PLANS.find(plan => plan.id === "ULTIMATE")?.tokens || 600,
    }
  }, [])

  return useMemo(() => {
    // Determine if we're still loading authentication data
    const isLoading = sessionStatus === "loading" || authStatus === "loading"
    
    // Determine if the user is logged in
    const isLoggedIn = sessionStatus === "authenticated" || isAuthenticated
    
    // Get the current plan information
    const subscriptionPlan = subscription?.subscriptionPlan as PlanType || "FREE"
    const isSubscribed = subscription?.isSubscribed || false
    
    // Current plan is FREE if not subscribed, otherwise use the subscription plan
    const currentPlan = !isSubscribed ? "FREE" : subscriptionPlan
    
    // Calculate available credits
    const credits = user?.credits || subscription?.credits || 0
    const hasCredits = credits >= requiredCredits
    
    // Calculate limits based on the current plan
    const maxQuestions = mergedConfig.maxQuestions[currentPlan] || DEFAULT_CONFIG.maxQuestions.FREE
    const maxQuizzes = mergedConfig.maxQuizzes[currentPlan] || DEFAULT_CONFIG.maxQuizzes.FREE
    
    // Plan hierarchy for comparison
    const planHierarchy: Record<PlanType, number> = {
      FREE: 0,
      BASIC: 1,
      PRO: 2,
      ULTIMATE: 3,
    }
    
    // Get available features based on current plan
    const availableFeatures = Object.entries(FEATURE_PLAN_REQUIREMENTS)
      .filter(([_, requiredPlan]) => planHierarchy[currentPlan] >= planHierarchy[requiredPlan])
      .map(([featureId, _]) => featureId)
    
    // Determine if the user can create a quiz (logged in, has credits)
    const canCreateQuiz = isLoggedIn && hasCredits && !isLoading
    
    // Add required plan based on action
    const getRequiredPlanForAction = (action: 'create' | 'edit' | 'advanced'): PlanType => {
      switch (action) {
        case 'advanced':
          return 'PRO'
        case 'edit':
          return 'BASIC'
        case 'create':
        default:
          return 'FREE'
      }
    }
    
    // Check if user meets plan requirements
    const meetsPlanRequirement = (requiredPlan: PlanType): boolean => {
      return planHierarchy[currentPlan] >= planHierarchy[requiredPlan]
    }
    
    return {
      isLoggedIn,
      isLoading,
      currentPlan,
      isSubscribed,
      credits,
      hasCredits,
      maxQuestions,
      maxQuizzes,
      planName: subscriptionPlan,
      canCreateQuiz,
      getRequiredPlanForAction,
      meetsPlanRequirement,
      availableFeatures,
      tokensPerPlan
    }
  }, [sessionStatus, authStatus, isAuthenticated, subscription, user?.credits, requiredCredits, mergedConfig, tokensPerPlan])
}

// Add a new function to enhance the hook with async capabilities
export function useQuizPlanAsync(requiredCredits: number = 1, config?: Partial<QuizPlanConfig>) {
  const quizPlan = useQuizPlan(requiredCredits, config)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { toast } = useToast() // Fixed: use proper toast hook
  const isMounted = useRef(true)
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])
  
  const withCreditCheck = useCallback(async <T>(
    action: () => Promise<T>, 
    options?: { 
      onInsufficientCredits?: () => void,
      onSuccess?: (result: T) => void,
      onError?: (error: Error) => void
    }
  ): Promise<T | undefined> => {
    if (!quizPlan.isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue",
        variant: "destructive",
      })
      router.push("/api/auth/signin")
      return undefined
    }
    
    if (!quizPlan.hasCredits) {
      if (options?.onInsufficientCredits) {
        options.onInsufficientCredits()
      } else {
        toast({
          title: "Insufficient Credits",
          description: "You need more credits to perform this action",
          variant: "destructive",
        })
        router.push("/dashboard/subscription")
      }
      return undefined
    }
    
    try {
      setIsProcessing(true)
      const result = await action()
      if (isMounted.current && options?.onSuccess) {
        options.onSuccess(result)
      }
      return result
    } catch (error) {
      if (isMounted.current) {
        if (options?.onError && error instanceof Error) {
          options.onError(error)
        } else {
          toast({
            title: "Operation Failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred",
            variant: "destructive",
          })
        }
      }
      return undefined
    } finally {
      if (isMounted.current) {
        setIsProcessing(false)
      }
    }
  }, [quizPlan, router, toast])
  
  return {
    ...quizPlan,
    isProcessing,
    withCreditCheck
  }
}

export default useQuizPlan;
