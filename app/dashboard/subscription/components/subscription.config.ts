import { CreditCard, Zap, Rocket, Crown } from "lucide-react"

export type SubscriptionPlanType = "FREE" | "BASIC" | "PRO" | "ULTIMATE"
export type SubscriptionStatusType = "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | "PENDING" | null

export interface SubscriptionPlan {
  id: SubscriptionPlanType
  name: string
  description: string
  icon: any
  tokens: number
  options: {
    duration: 1 | 6
    price: number
  }[]
  limits: {
    maxQuestionsPerQuiz: number
    maxCoursesPerMonth: number
  }
  features: {
    name: string
    available: boolean
    comingSoon?: boolean
  }[]
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "FREE",
    name: "FREE",
    description: "Basic access to essential features",
    icon: CreditCard,
    tokens: 10,
    options: [
      {
        duration: 1,
        price: 0,
      },
      {
        duration: 6,
        price: 0,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 5,
      maxCoursesPerMonth: 1,
    },
    features: [
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: false },
      { name: "Code Quiz", available: false },
      { name: "Video Quiz", available: false },
      { name: "PDF Downloads", available: false },
      { name: "Video Transcripts", available: false },
      { name: "AI Accuracy", available: false },
      { name: "Priority Support", available: false },
    ],
  },
  {
    id: "BASIC",
    name: "BASIC",
    description: "Enhanced features for casual users",
    icon: Zap,
    tokens: 50,
    options: [
      {
        duration: 1,
        price: 9.99,
      },
      {
        duration: 6,
        price: 49.99,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 15,
      maxCoursesPerMonth: 5,
    },
    features: [
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: false },
      { name: "Video Quiz", available: false },
      { name: "PDF Downloads", available: true },
      { name: "Video Transcripts", available: false },
      { name: "AI Accuracy", available: false },
      { name: "Priority Support", available: false },
    ],
  },
  {
    id: "PRO",
    name: "PRO",
    description: "Advanced features for power users",
    icon: Rocket,
    tokens: 200,
    options: [
      {
        duration: 1,
        price: 19.99,
      },
      {
        duration: 6,
        price: 99.99,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 30,
      maxCoursesPerMonth: 15,
    },
    features: [
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },
      { name: "Video Quiz", available: true },
      { name: "PDF Downloads", available: true },
      { name: "Video Transcripts", available: true },
      { name: "AI Accuracy", available: false, comingSoon: true },
      { name: "Priority Support", available: false },
    ],
  },
  {
    id: "ULTIMATE",
    name: "ULTIMATE",
    description: "Premium features for professionals",
    icon: Crown,
    tokens: 500,
    options: [
      {
        duration: 1,
        price: 39.99,
      },
      {
        duration: 6,
        price: 199.99,
      },
    ],
    limits: {
      maxQuestionsPerQuiz: 50,
      maxCoursesPerMonth: 30,
    },
    features: [
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },
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
      "Tokens are our platform's currency for generating content. Each token allows you to create one course or generate one quiz. The number of tokens you have depends on your subscription plan.",
  },
  {
    question: "Can I upgrade my plan at any time?",
    answer:
      "Yes, you can upgrade your subscription plan at any time. When you upgrade, you'll be charged the prorated difference for the remainder of your billing cycle.",
  },
  {
    question: "What happens if I run out of tokens?",
    answer:
      "If you run out of tokens, you can purchase additional tokens or upgrade to a higher-tier plan that includes more tokens.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of your current billing period.",
  },
  {
    question: "Do unused tokens roll over to the next month?",
    answer: "Yes, unused tokens roll over to the next month as long as your subscription remains active.",
  },
]

