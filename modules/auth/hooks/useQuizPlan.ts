'use client'
import { useMemo } from "react"
import { useAuth } from "./useAuth"
import { SUBSCRIPTION_PLANS } from "@/app/dashboard/subscription/components/subscription-plans"

export type PlanType = "FREE" | "BASIC" | "PREMIUM" | "ULTIMATE"

interface QuizPlanConfig {
  maxQuestions: Record<PlanType, number>
  maxQuizzes: Record<PlanType, number>
}

const getPlanLimit = (planId: string, key: keyof (typeof SUBSCRIPTION_PLANS)[number]["limits"], fallback: number) => {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
  return plan && plan.limits && typeof plan.limits[key] === 'number' ? plan.limits[key] : fallback
}

const DEFAULT_CONFIG: QuizPlanConfig = {
  maxQuestions: {
    FREE: getPlanLimit("FREE", "maxQuestionsPerQuiz", 10),
    BASIC: getPlanLimit("BASIC", "maxQuestionsPerQuiz", 15),
    PREMIUM: getPlanLimit("PREMIUM", "maxQuestionsPerQuiz", 30),
    ULTIMATE: getPlanLimit("ULTIMATE", "maxQuestionsPerQuiz", 50),
  },
  maxQuizzes: {
    FREE: getPlanLimit("FREE", "maxCoursesPerMonth", 2),
    BASIC: getPlanLimit("BASIC", "maxCoursesPerMonth", 10),
    PREMIUM: getPlanLimit("PREMIUM", "maxCoursesPerMonth", 30),
    ULTIMATE: getPlanLimit("ULTIMATE", "maxCoursesPerMonth", 100),
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
  const { user, plan, credits, hasActiveSubscription, isAuthenticated, isLoading } = useAuth() || {}

  // Defensive: fallback to empty object if undefined
  const mergedConfig = useMemo(() => {
    return {
      maxQuestions: {
        ...DEFAULT_CONFIG.maxQuestions,
        ...(config?.maxQuestions || {}),
      },
      maxQuizzes: {
        ...DEFAULT_CONFIG.maxQuizzes,
        ...(config?.maxQuizzes || {}),
      },
    }
  }, [config])

  return useMemo(() => {
    const currentPlan: PlanType = (plan && ["FREE","BASIC","PREMIUM","ULTIMATE"].includes(plan))
      ? plan as PlanType
      : "FREE"
    const isSubscribed: boolean = hasActiveSubscription || false
    const userCredits = typeof credits === 'number' ? credits : 0
    const hasCredits = userCredits >= requiredCredits

    const maxQuestions = mergedConfig.maxQuestions[currentPlan] ?? DEFAULT_CONFIG.maxQuestions.FREE
    const maxQuizzes = mergedConfig.maxQuizzes[currentPlan] ?? DEFAULT_CONFIG.maxQuizzes.FREE

    const planHierarchy: Record<PlanType, number> = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      ULTIMATE: 3,
    }

    const availableFeatures = Object.entries(FEATURE_PLAN_REQUIREMENTS)
      .filter(([_, requiredPlan]) => planHierarchy[currentPlan] >= planHierarchy[requiredPlan])
      .map(([featureId]) => featureId)

    const canCreateQuiz = !!isAuthenticated && hasCredits && !isLoading

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
      isLoggedIn: !!isAuthenticated,
      isLoading: !!isLoading,
      currentPlan,
      isSubscribed,
      credits: userCredits,
      hasCredits,
      maxQuestions,
      maxQuizzes,
      planName: currentPlan,
      canCreateQuiz,
      getRequiredPlanForAction,
      meetsPlanRequirement,
      availableFeatures,
    }
  }, [isAuthenticated, isLoading, plan, credits, hasActiveSubscription, requiredCredits, mergedConfig])
}

export default useQuizPlan
