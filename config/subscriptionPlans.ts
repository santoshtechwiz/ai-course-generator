import { Zap, Rocket, Star, Crown } from 'lucide-react';

export const SUBSCRIPTION_PLANS = [
  {
    name: "FREE",
    icon: Zap,
    options: [{ duration: 1, price: 0 }],
    tokens: 5,
    limits: {
      courses: 3,
      totalQuestions: 3,
      maxQuestionsPerQuiz: 3,
    },
    features: [
      "3 courses",
      "Up to 3 questions across all quizzes",
      "Basic AI accuracy",
      "Video transcripts",
      "No Video Quiz",
      "No PDF downloads",
    ],
  },
  {
    name: "BASIC",
    icon: Rocket,
    options: [
      { duration: 1, price: 9.99 },
      { duration: 6, price: 49.99 },
    ],
    tokens: 20,
    limits: {
      courses: 10,
      totalQuestions: 5,
      maxQuestionsPerQuiz: 5,
    },
    features: [
      "10 courses",
      "Up to 5 questions per quiz",
      "Better AI accuracy",
      "Video transcripts",
    ],
  },
  {
    name: "PRO",
    icon: Star,
    options: [
      { duration: 1, price: 19.99 },
      { duration: 6, price: 99.99 },
    ],
    tokens: 60,
    limits: {
      courses: 50,
      totalQuestions: 20,
      maxQuestionsPerQuiz: 10,
    },
    features: [
      "50 courses",
      "Up to 10 questions per quiz",
      "High AI accuracy",
      "PDF downloads",
      "Video Quiz",
      "Priority support",
    ],
  },
  {
    name: "ULTIMATE",
    icon: Crown,
    options: [
      { duration: 1, price: 34.99 },
      { duration: 6, price: 179.99 },
    ],
    tokens: 150,
    limits: {
      courses: 100,
      totalQuestions: 30,
      maxQuestionsPerQuiz: 15,
    },
    features: [
      "100 courses",
      "Up to 15 questions per quiz",
      "Highest AI accuracy",
      "Coding quizzes",
      "Video Quiz",
      "Priority support",
    ],
  },
] as const;







export const FAQ_ITEMS = [
  {
    question: "What's included in each course?",
    answer:
      "Each course can include video content, transcripts, various types of quizzes (MCQ, Fill-in-the-Blank, open-ended), and sections to organize your content. The number and complexity of these features depend on your subscription plan.",
  },
  {
    question: "Can I upgrade my plan?",
    answer:
      "Yes, you can upgrade your plan at any time. Your new benefits will be available immediately after upgrading.",
  },
  {
    question: "What happens if I reach my quiz or section limit?",
    answer:
      "If you reach your plan's limit for quizzes or sections, you'll need to upgrade to a higher tier plan to add more. Existing content will remain accessible.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "We offer a 14-day money-back guarantee for paid plans. If you're not satisfied, you can request a full refund within this period.",
  },
] as const

export type SubscriptionPlanType = (typeof SUBSCRIPTION_PLANS)[number]["name"]

export const SUBSCRIPTION_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
} as const

export type SubscriptionStatusType = keyof typeof SUBSCRIPTION_STATUSES

