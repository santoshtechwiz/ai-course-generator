import { Zap, Rocket, Star, Crown } from "lucide-react"

export const SUBSCRIPTION_PLANS = [
  {
    name: "FREE",
    icon: Zap,
    options: [{ duration: 1, price: 0 }],
    tokens: 5,
    limits: {
      totalQuestions: 3,
      maxQuestionsPerQuiz: 3,
    },
    features: [
      "5 tokens to use on courses or quizzes",
      "Up to 3 questions per quiz",
      "Basic AI accuracy",
      "Video transcripts",
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
      totalQuestions: 5,
      maxQuestionsPerQuiz: 5,
    },
    features: [
      "20 tokens to use on courses or quizzes",
      "Up to 5 questions per quiz",
      "Better AI accuracy",
      "Video transcripts",
      "PDF downloads",
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
      totalQuestions: 20,
      maxQuestionsPerQuiz: 10,
    },
    features: [
      "60 tokens to use on courses or quizzes",
      "Up to 10 questions per quiz",
      "High AI accuracy",
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
      totalQuestions: 30,
      maxQuestionsPerQuiz: 15,
    },
    features: [
      "150 tokens to use on courses or quizzes",
      "Up to 15 questions per quiz",
      "Highest AI accuracy",
      "Coding quizzes",
      "Video Quiz",
      "Priority support",
    ],
  },
] as const

export const TOKEN_USAGE = {
  course: 1,
  quiz: 1,
}

export const FAQ_ITEMS = [
  {
    question: "How do tokens work?",
    answer:
      "Tokens are a flexible currency you can use across different features. One token can be used to create one course or one quiz. The number of questions per quiz is limited based on your plan.",
  },
  {
    question: "What are the quiz limits?",
    answer:
      "Each plan has a limit on the total number of questions you can create across all quizzes, as well as a maximum number of questions per individual quiz. Check the plan details for specific limits.",
  },
  // Add more FAQ items as needed
]

export type SubscriptionPlanType = (typeof SUBSCRIPTION_PLANS)[number]["name"]
export type SubscriptionStatusType = "active" | "canceled" | "expired" | null

