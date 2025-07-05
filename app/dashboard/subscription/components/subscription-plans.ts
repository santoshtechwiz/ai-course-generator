/**
 * Subscription Plans Configuration
 *
 * This file contains the configuration for all subscription plans.
 * It's separated from the business logic to make it easier to modify
 * plan details without changing the core functionality.
 */

import type {
  AddOnPackage,
  FAQItem,
  SubscriptionPlan,
  FeatureAvailability,
} from "@/app/types/subscription"
import { CreditCard, Zap, Rocket, Crown } from "lucide-react"

// First, let's examine the current structure of features in the subscription plans
// Each plan has a features array with objects containing name and availability

// Let's modify this to create a more maintainable feature management system

/**
 * Feature Categories for better organization
 */
export enum FeatureCategory {
  CORE = "Core Features",
  CONTENT = "Content Creation",
  ANALYTICS = "Analytics & Reporting",
  SUPPORT = "Support & Services",
  ADVANCED = "Advanced Features",
}

/**
 * Feature definitions with metadata for better management
 */
export const FEATURES: Record<
  string,
  {
    id: string
    name: string
    description: string
    category: FeatureCategory
    icon: string
  }
> = {
  // Core Features
  COURSE_CREATION: {
    id: "course-creation",
    name: "Course Creation",
    description: "Create and manage custom learning courses",
    category: FeatureCategory.CORE,
    icon: "BookOpen",
  },
  MCQ_GENERATOR: {
    id: "mcq-generator",
    name: "MCQ Generator",
    description: "Generate multiple-choice questions automatically",
    category: FeatureCategory.CONTENT,
    icon: "ListChecks",
  },
  FILL_BLANKS: {
    id: "blanks",
    name: "Fill in the Blanks",
    description: "Create fill-in-the-blank exercises",
    category: FeatureCategory.CONTENT,
    icon: "TextCursor",
  },
  OPEN_ENDED: {
    id: "open-ended",
    name: "Open-ended Questions",
    description: "Generate open-ended questions for deeper learning",
    category: FeatureCategory.CONTENT,
    icon: "MessageSquare",
  },
  CODE_QUIZ: {
    id: "code-quiz",
    name: "Code Quiz",
    description: "Create and solve coding challenges and quizzes",
    category: FeatureCategory.CONTENT,
    icon: "Code",
  },
  VIDEO_QUIZ: {
    id: "video-quiz",
    name: "Video Quiz",
    description: "Generate quizzes from video content",
    category: FeatureCategory.CONTENT,
    icon: "Video",
  },
  PDF_DOWNLOADS: {
    id: "pdf-downloads",
    name: "PDF Downloads",
    description: "Download content as PDF documents",
    category: FeatureCategory.CORE,
    icon: "FileDown",
  },
  VIDEO_TRANSCRIPTS: {
    id: "video-transcripts",
    name: "Video Transcripts",
    description: "Access transcripts of video content",
    category: FeatureCategory.CONTENT,
    icon: "FileText",
  },
  AI_ACCURACY: {
    id: "ai-accuracy",
    name: "AI Accuracy",
    description: "Enhanced AI accuracy for better content generation",
    category: FeatureCategory.ADVANCED,
    icon: "Zap",
  },
  PRIORITY_SUPPORT: {
    id: "priority-support",
    name: "Priority Support",
    description: "Get faster responses to support requests",
    category: FeatureCategory.SUPPORT,
    icon: "HeadphonesIcon",
  },
}

/**
 * Feature availability matrix for each plan
 * This makes it easier to update which features are available in which plans
 */
export const PLAN_FEATURES: Record<string, Record<string, { available: boolean }>> = {
  FREE: {
    [FEATURES.COURSE_CREATION.id]: { available: true },
    [FEATURES.MCQ_GENERATOR.id]: { available: true },
    [FEATURES.FILL_BLANKS.id]: { available: true },
    [FEATURES.OPEN_ENDED.id]: { available: true },
    [FEATURES.CODE_QUIZ.id]: { available: true },
    [FEATURES.VIDEO_TRANSCRIPTS.id]: { available: true },
    [FEATURES.VIDEO_QUIZ.id]: { available: true },
    [FEATURES.PDF_DOWNLOADS.id]: { available: true },
    [FEATURES.AI_ACCURACY.id]: { available: false },
    [FEATURES.PRIORITY_SUPPORT.id]: { available: false },
  },
  BASIC: {
    [FEATURES.COURSE_CREATION.id]: { available: true },
    [FEATURES.MCQ_GENERATOR.id]: { available: true },
    [FEATURES.FILL_BLANKS.id]: { available: true },
    [FEATURES.OPEN_ENDED.id]: { available: true },
    [FEATURES.CODE_QUIZ.id]: { available: true },
    [FEATURES.VIDEO_TRANSCRIPTS.id]: { available: true },
    [FEATURES.VIDEO_QUIZ.id]: { available: true },
    [FEATURES.PDF_DOWNLOADS.id]: { available: true },
    [FEATURES.AI_ACCURACY.id]: { available: false },
    [FEATURES.PRIORITY_SUPPORT.id]: { available: false },
  },
  PRO: {
    [FEATURES.COURSE_CREATION.id]: { available: true },
    [FEATURES.MCQ_GENERATOR.id]: { available: true },
    [FEATURES.FILL_BLANKS.id]: { available: true },
    [FEATURES.OPEN_ENDED.id]: { available: true },
    [FEATURES.CODE_QUIZ.id]: { available: true },
    [FEATURES.VIDEO_TRANSCRIPTS.id]: { available: true },
    [FEATURES.VIDEO_QUIZ.id]: { available: true },
    [FEATURES.PDF_DOWNLOADS.id]: { available: true },
    [FEATURES.AI_ACCURACY.id]: { available: true },
    [FEATURES.PRIORITY_SUPPORT.id]: { available: false },
  },
  ULTIMATE: {
    [FEATURES.COURSE_CREATION.id]: { available: true },
    [FEATURES.MCQ_GENERATOR.id]: { available: true },
    [FEATURES.FILL_BLANKS.id]: { available: true },
    [FEATURES.OPEN_ENDED.id]: { available: true },
    [FEATURES.CODE_QUIZ.id]: { available: true },
    [FEATURES.VIDEO_TRANSCRIPTS.id]: { available: true },
    [FEATURES.VIDEO_QUIZ.id]: { available: true },
    [FEATURES.PDF_DOWNLOADS.id]: { available: true },
    [FEATURES.AI_ACCURACY.id]: { available: true },
    [FEATURES.PRIORITY_SUPPORT.id]: { available: true },
  },
}

// Helper function to get features for a plan with proper structure
export function getPlanFeatures(planId: string): FeatureAvailability[] {
  const planFeatureMatrix = PLAN_FEATURES[planId] || {}

  return Object.entries(FEATURES).map(([key, feature]) => {
    const availability = planFeatureMatrix[feature.id] || { available: false }
    return {
      ...feature,
      ...availability,
    }
  })
}

// Now update the SUBSCRIPTION_PLANS to use the new feature system
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "FREE",
    name: "FREE",
    description: "Basic access to essential features",
    icon: CreditCard,
    tokens: 5,
    options: [
      {
        duration: 1,
        price: 0,
        currency: "USD",
      },
      {
        duration: 6,
        price: 0,
        currency: "USD",
      },
      {
        duration: 12,
        price: 0,
        currency: "USD",
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 5,
      maxCoursesPerMonth: 1,
      apiCallsPerDay: 10,
    },
    features: getPlanFeatures("FREE"),
  },
  {
    id: "BASIC",
    name: "BASIC",
    description: "Enhanced features for casual users",
    icon: Zap,
    tokens: 60,
    options: [
      {
        duration: 1,
        price: 12.99,
        currency: "USD",
      },
      {
        duration: 6,
        price: 69.99,
        currency: "USD",
        savings: 10,
      },
      {
        duration: 12,
        price: 129.99,
        currency: "USD",
        savings: 17,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 15,
      maxCoursesPerMonth: 5,
      apiCallsPerDay: 50,
    },
    features: getPlanFeatures("BASIC"),
  },
  {
    id: "PREMIUM",
    name: "PREMIUM",
    description: "Advanced features for power users",
    icon: Rocket,
    tokens: 250,
    popular: true,
    options: [
      {
        duration: 1,
        price: 24.99,
        currency: "USD",
      },
      {
        duration: 6,
        price: 134.99,
        currency: "USD",
        savings: 10,
      },
      {
        duration: 12,
        price: 249.99,
        currency: "USD",
        savings: 17,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 40,
      maxCoursesPerMonth: 20,
      apiCallsPerDay: 200,
    },
    features: getPlanFeatures("PREMIUM"),
  },
  {
    id: "ULTIMATE",
    name: "ULTIMATE",
    description: "Premium features for professionals",
    icon: Crown,
    tokens: 600,
    options: [
      {
        duration: 1,
        price: 49.99,
        currency: "USD",
      },
      {
        duration: 6,
        price: 269.99,
        currency: "USD",
        savings: 10,
      },
      {
        duration: 12,
        price: 499.99,
        currency: "USD",
        savings: 17,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 100,
      maxCoursesPerMonth: 50,
      apiCallsPerDay: 500,
    },
    features: getPlanFeatures("ULTIMATE"),
  },
]

// FAQ items
export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What are tokens and how do they work?",
    answer:
      "Tokens are our platform's currency for generating content. Each token allows you to create one quiz or course. The number of tokens you have depends on your subscription plan, and you can purchase additional tokens as needed.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "You can upgrade or downgrade your subscription plan, but changes will only take effect once your current tokens are used up. This ensures that you get the full value of your purchased tokens before switching plans.",
  },
  {
    question: "What happens if I run out of tokens?",
    answer:
      "If you run out of tokens, you can purchase additional tokens through our Token Booster add-on package. Your existing quizzes and courses will remain accessible even if you run out of tokens.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "Subscription cancellation is currently not supported. Your plan remains active until all tokens are used. You can choose not to renew your plan once your tokens expire.",
  },
  {
    question: "Do unused tokens roll over to the next month?",
    answer:
      "Yes, unused tokens roll over to the next month as long as your subscription remains active. There is no expiration date for tokens while you maintain an active subscription.",
  },
  {
    question: "Is there a discount for educational institutions?",
    answer:
      "Yes, we offer special pricing for educational institutions and volume discounts for teams. Please contact our sales team for more information about our educational pricing options.",
  },
  {
    question: "Can I try the premium features before subscribing?",
    answer:
      "We offer a one-month free trial of our Pro plan for new users. During the trial, you'll have access to all Pro features including Code Quiz and Video Quiz generation. No credit card is required to start your trial.",
  },
]
// Add-on packages
export const ADD_ON_PACKAGES: AddOnPackage[] = [
  {
    id: "token-booster",
    name: "Token Booster",
    description: "Add more tokens to your account",
    price: 9.99,
    features: ["100 additional tokens", "Never expires", "Use anytime", "Compatible with all plans"],
  },
  {
    id: "analytics-pro",
    name: "Analytics Pro",
    description: "Advanced analytics and insights",
    price: 14.99,
    features: [
      "Student performance tracking",
      "Quiz effectiveness metrics",
      "Learning pattern analysis",
      "Exportable reports",
    ],
  },
  {
    id: "api-package",
    name: "API Package",
    description: "Additional API calls for heavy users",
    price: 19.99,
    features: ["500 additional API calls", "Higher rate limits", "Priority processing", "Advanced models access"],
  },
  {
    id: "support-plus",
    name: "Support Plus",
    description: "Enhanced support options",
    price: 7.99,
    features: ["Priority email support", "Live chat assistance", "1 hour response time", "Dedicated support agent"],
  },
]

// Valid promo codes with their discount percentages
export const VALID_PROMO_CODES: Record<string, number> = {
  AILAUNCH20: 20,
  WELCOME10: 10,
  SPRING2025: 15,
}

/**
 * ===========================================
 * CENTRALIZED MAPPING UTILITIES FOR AUTHENTICATION
 * ===========================================
 *
 * These utilities are used by AuthProvider and other components
 * to maintain consistent plan/status mapping across the app.
 */

import type { SubscriptionPlanType } from '@/app/types/subscription'

/**
 * Maps various subscription plan string values to standardized SubscriptionPlanType
 */
export function mapSubscriptionPlan(sessionPlan: string | null | undefined): SubscriptionPlanType {
  if (!sessionPlan) return 'FREE'
  
  const plan = sessionPlan.toLowerCase().trim()
  
  // Handle various plan name formats
  if (plan.includes('premium') || plan.includes('pro')) return 'PREMIUM'
  if (plan.includes('ultimate') || plan.includes('enterprise')) return 'ULTIMATE'
  if (plan.includes('basic') || plan.includes('starter')) return 'BASIC'
  
  // Handle plan IDs
  if (plan === 'premium_monthly' || plan === 'premium_yearly') return 'PREMIUM'
  if (plan === 'ultimate_monthly' || plan === 'ultimate_yearly') return 'ULTIMATE'
  if (plan === 'basic_monthly' || plan === 'basic_yearly') return 'BASIC'
  
  // Default fallback
  return 'FREE'
}

/**
 * Maps various subscription status values to standardized format
 */
export function mapSubscriptionStatus(sessionStatus: string | null | undefined): 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing' {
  if (!sessionStatus) return 'inactive'
  
  const status = sessionStatus.toLowerCase().trim()
  
  if (status === 'active' || status === 'paid') return 'active'
  if (status === 'canceled' || status === 'cancelled') return 'canceled'
  if (status === 'past_due' || status === 'pastdue') return 'past_due'
  if (status === 'trialing' || status === 'trial') return 'trialing'
  
  return 'inactive'
}

/**
 * Get feature limits for a specific plan (for AuthProvider usage)
 */
export function getFeaturesByPlanForAuth(plan: SubscriptionPlanType) {
  const planConfig = SUBSCRIPTION_PLANS.find(p => p.id === plan)
  
  if (!planConfig) {
    // Default FREE plan features
    return {
      maxQuizzes: 3,
      maxFlashcards: 10,
      maxStudySessions: 5,
      advancedAnalytics: false,
      prioritySupport: false,
      customization: false
    }
  }
  
  // Map the plan's features to our AuthProvider format
  const hasFeature = (featureId: string) => 
    planConfig.features.some(f => f.id === featureId && f.available)
    return {
    maxQuizzes: plan === 'FREE' ? 3 : plan === 'BASIC' ? 10 : plan === 'PREMIUM' ? 50 : 100,
    maxFlashcards: plan === 'FREE' ? 10 : plan === 'BASIC' ? 50 : plan === 'PREMIUM' ? 200 : 500,
    maxStudySessions: plan === 'FREE' ? 5 : plan === 'BASIC' ? 20 : plan === 'PREMIUM' ? 100 : 300,
    advancedAnalytics: hasFeature('pdf-downloads') && plan !== 'FREE', // Use PDF downloads as proxy for premium features
    prioritySupport: hasFeature('priority-support') || (plan === 'PREMIUM' || plan === 'ULTIMATE'),
    customization: hasFeature('custom-themes') || (plan === 'PREMIUM' || plan === 'ULTIMATE')
  }
}
