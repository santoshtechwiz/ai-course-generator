import { CreditCard, Zap, Rocket, Crown } from 'lucide-react'

export type SubscriptionPlanType = "FREE" | "BASIC" | "PRO" | "ULTIMATE"
export type SubscriptionStatusType = "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | "PENDING" | null

export interface SubscriptionPlan {
  id: SubscriptionPlanType
  name: string
  description: string
  icon: any
  tokens: number
  options: {
    duration: 1 | 6 | 12
    price: number
    savings?: number
  }[]
  limits: {
    maxQuestionsPerQuiz: number
    maxCoursesPerMonth: number
    apiCallsPerDay?: number
  }
  features: {
    name: string
    available: boolean
    comingSoon?: boolean
  }[]
  popular?: boolean
}

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
      },
      {
        duration: 6,
        price: 0,
      },
      {
        duration: 12,
        price: 0,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 5,
      maxCoursesPerMonth: 1,
      apiCallsPerDay: 10,
    },
    features: [
      { name: 'Course Creation', available: true },
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },
      { name: 'Video Transcripts', available: false },
      { name: "Video Quiz", available: false },
      { name: "PDF Downloads", available: false },
      { name: "AI Accuracy", available: false },
      { name: "Priority Support", available: false },
    ],
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
      },
      {
        duration: 6,
        price: 69.99,
        savings: 10,
      },
      {
        duration: 12,
        price: 129.99,
        savings: 17,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 15,
      maxCoursesPerMonth: 5,
      apiCallsPerDay: 50,
    },
    features: [
      { name: 'Course Creation', available: true },
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },
      { name: 'Video Transcripts', available: true },
      { name: "Video Quiz", available: true },
      { name: "PDF Downloads", available: true },
      { name: "Video Transcripts", available: true },
      { name: "AI Accuracy", available: false },
      { name: "Priority Support", available: false },
    ],
  },
  {
    id: "PRO",
    name: "PRO",
    description: "Advanced features for power users",
    icon: Rocket,
    tokens: 250,
    popular: true,
    options: [
      {
        duration: 1,
        price: 24.99,
      },
      {
        duration: 6,
        price: 134.99,
        savings: 10,
      },
      {
        duration: 12,
        price: 249.99,
        savings: 17,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 40,
      maxCoursesPerMonth: 20,
      apiCallsPerDay: 200,
    },
    features: [
      { name: 'Course Creation', available: true },
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },
      { name: 'Video Transcripts', available: true },
      { name: "Video Quiz", available: true },
      { name: "PDF Downloads", available: true },
      { name: "Video Transcripts", available: true },
      { name: "AI Accuracy", available: true },
      { name: "Priority Support", available: false },
    ],
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
      },
      {
        duration: 6,
        price: 269.99,
        savings: 10,
      },
      {
        duration: 12,
        price: 499.99,
        savings: 17,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 100,
      maxCoursesPerMonth: 50,
      apiCallsPerDay: 500,
    },
    features: [
      { name: 'Course Creation', available: true },
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },
      { name: 'Video Transcripts', available: true },
      { name: "Video Quiz", available: true },
      { name: "PDF Downloads", available: true },
      { name: "Video Transcripts", available: true },
      { name: "AI Accuracy", available: true },
      { name: "Priority Support", available: true },
    ],
  },
]

export const FAQ_ITEMS = [
  {
    question: "What are tokens and how do they work?",
    answer:
      "Tokens are our platform's currency for generating content. Each token allows you to create one quiz or course. The number of tokens you have depends on your subscription plan, and you can purchase additional tokens as needed.",
  },
  {
    question: "Can I upgrade my plan at any time?",
    answer:
      "Yes, you can upgrade your subscription plan at any time. When you upgrade, you'll be charged the prorated difference for the remainder of your billing cycle. Your unused tokens will carry over to your new plan.",
  },
  {
    question: "What happens if I run out of tokens?",
    answer:
      "If you run out of tokens, you can purchase additional tokens through our Token Booster add-on package or upgrade to a higher-tier plan that includes more tokens. Your existing quizzes and courses will remain accessible even if you run out of tokens.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of your current billing period. After cancellation, you'll still have access to your created content, but you won't be able to create new quizzes or courses without an active subscription.",
  },
  {
    question: "Do unused tokens roll over to the next month?",
    answer:
      "Yes, unused tokens roll over to the next month as long as your subscription remains active. There is no expiration date for tokens while you maintain an active subscription.",
  },
  {
    question: "What are API calls and why are they limited?",
    answer:
      "API calls are requests to our AI services that generate quiz questions and other content. Each plan has daily API call limits to ensure fair usage and system stability. Most users won't reach these limits during normal usage, but power users who need more can purchase additional API calls through our add-on packages.",
  },
  {
    question: "Is there a discount for educational institutions?",
    answer:
      "Yes, we offer special pricing for educational institutions and volume discounts for teams. Please contact our sales team for more information about our educational pricing options.",
  },
  {
    question: "Can I try the premium features before subscribing?",
    answer:
      "We offer a 7-day free trial of our Pro plan for new users. During the trial, you'll have access to all Pro features including Code Quiz and Video Quiz generation. No credit card is required to start your trial.",
  },
]

export const ADD_ON_PACKAGES = [
  {
    id: "token-booster",
    name: "Token Booster",
    description: "Add more tokens to your account",
    price: 9.99,
    features: [
      "100 additional tokens",
      "Never expires",
      "Use anytime",
      "Compatible with all plans"
    ]
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
      "Exportable reports"
    ]
  },
  {
    id: "api-package",
    name: "API Package",
    description: "Additional API calls for heavy users",
    price: 19.99,
    features: [
      "500 additional API calls",
      "Higher rate limits",
      "Priority processing",
      "Advanced models access"
    ]
  },
  {
    id: "support-plus",
    name: "Support Plus",
    description: "Enhanced support options",
    price: 7.99,
    features: [
      "Priority email support",
      "Live chat assistance",
      "1 hour response time",
      "Dedicated support agent"
    ]
  }
]
