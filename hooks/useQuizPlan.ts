import { useMemo, useState, useEffect } from "react"
import { useAuth } from "@/modules/auth"
import { ClientCreditService } from "@/services/client-credit-service"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"

export type PlanType = "FREE" | "BASIC" | "PREMIUM" | "ULTIMATE"

interface QuizPlanConfig {
  maxQuestions: Record<PlanType, number>
  maxQuizzes: Record<PlanType, number>
}

const DEFAULT_CONFIG: QuizPlanConfig = {
  maxQuestions: {
    FREE: SUBSCRIPTION_PLANS.find(plan => plan.id === "FREE")?.limits.maxQuestionsPerQuiz || 10,
    BASIC: SUBSCRIPTION_PLANS.find(plan => plan.id === "BASIC")?.limits.maxQuestionsPerQuiz || 15,
    PREMIUM: SUBSCRIPTION_PLANS.find(plan => plan.id === "PREMIUM")?.limits.maxQuestionsPerQuiz || 30,
    ULTIMATE: SUBSCRIPTION_PLANS.find(plan => plan.id === "ULTIMATE")?.limits.maxQuestionsPerQuiz || 50,
  },
  maxQuizzes: {
    FREE: SUBSCRIPTION_PLANS.find(plan => plan.id === "FREE")?.limits.maxCoursesPerMonth || 2,
    BASIC: SUBSCRIPTION_PLANS.find(plan => plan.id === "BASIC")?.limits.maxCoursesPerMonth || 10,
    PREMIUM: SUBSCRIPTION_PLANS.find(plan => plan.id === "PREMIUM")?.limits.maxCoursesPerMonth || 30,
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
}

const FEATURE_PLAN_REQUIREMENTS: Record<string, PlanType> = {
  'mcq-generator': 'FREE',
  'blanks': 'FREE',
  'open-ended': 'BASIC',
  'code-quiz': 'BASIC',
  'video-quiz': 'PREMIUM',
  'pdf-downloads': 'FREE',
  'ai-accuracy': 'PREMIUM',
}

export function useQuizPlan(requiredCredits: number = 1, config?: Partial<QuizPlanConfig>): QuizPlanData {
  const { user, subscription, isAuthenticated, isLoading } = useAuth()
  const [credits, setCredits] = useState(0)
  const [creditLoading, setCreditLoading] = useState(true)
  
  // Fetch current credit information from ClientCreditService for consistency
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setCreditLoading(true)
      ClientCreditService.getCreditDetails()
        .then(creditInfo => {
          setCredits(creditInfo.remainingCredits)
          setCreditLoading(false)
        })
        .catch(error => {
          console.error('[useQuizPlan] Failed to fetch credit details:', error)
          setCredits(0)
          setCreditLoading(false)
        })
    } else {
      setCredits(0)
      setCreditLoading(false)
    }
  }, [isAuthenticated, user?.id])
  
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
  }), [config])
  
  return useMemo(() => {
    const currentPlan = (subscription?.plan as PlanType) || "FREE"
    const isSubscribed = subscription?.status === 'active' || false
    const hasCredits = credits >= requiredCredits

    const maxQuestions = mergedConfig.maxQuestions[currentPlan] || DEFAULT_CONFIG.maxQuestions.FREE
    const maxQuizzes = mergedConfig.maxQuizzes[currentPlan] || DEFAULT_CONFIG.maxQuizzes.FREE

    const planHierarchy: Record<PlanType, number> = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      ULTIMATE: 3,
    }

    const availableFeatures = Object.entries(FEATURE_PLAN_REQUIREMENTS)
      .filter(([_, requiredPlan]) => planHierarchy[currentPlan] >= planHierarchy[requiredPlan])
      .map(([featureId, _]) => featureId)

    const canCreateQuiz = isAuthenticated && hasCredits && !isLoading && !creditLoading

    const getRequiredPlanForAction = (action: 'create' | 'edit' | 'advanced'): PlanType => {
      switch (action) {
        case 'advanced':
          return 'PREMIUM'
        case 'edit':
          return 'BASIC'
        case 'create':
        default:
          return 'FREE'
      }
    }

    const meetsPlanRequirement = (requiredPlan: PlanType): boolean => {
      return planHierarchy[currentPlan] >= planHierarchy[requiredPlan]
    }

    return {
      isLoggedIn: isAuthenticated,
      isLoading: isLoading || creditLoading,
      currentPlan,
      isSubscribed,
      credits,
      hasCredits,
      maxQuestions,
      maxQuizzes,
      planName: currentPlan,
      canCreateQuiz,
      getRequiredPlanForAction,
      meetsPlanRequirement,
      availableFeatures,
    }
  }, [isAuthenticated, isLoading, creditLoading, subscription, credits, requiredCredits, mergedConfig])
}

export default useQuizPlan
