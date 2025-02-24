import type React from "react"
import { Star, Rocket, Zap, Crown } from "lucide-react"

type SubscriptionPlan = {
  name: string
  id: "FREE" | "BASIC" | "PRO" | "ULTIMATE"
  icon: React.ComponentType
  tokens: number
  options: { duration: number; price: number }[]
  limits: { maxQuestionsPerQuiz: number }
  features: { name: string; available: boolean; comingSoon?: boolean }[]
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    name: "FREE",
    id: "FREE",
    icon: Star,
    tokens: 5,
    options: [{ duration: 1, price: 0 }],
    limits: { maxQuestionsPerQuiz: 3 },
    features: [
      { name: "Multiple Choice Questions Generator", available: true },
      { name: "Fill in the Blanks Questions", available: true },
      { name: "Open-ended Questions", available: false },
      { name: "Coding Quiz Generator", available: false },
      { name: "Quiz from Video Transcript", available: false },
      { name: "PDF Downloads (All Quizzes & Transcripts)", available: false },
      { name: "Video Transcripts", available: false },
      { name: "Document to Quiz Converter (Coming Soon)", available: false, comingSoon: true },
      { name: "Enhanced AI Accuracy", available: false },
      { name: "Priority Support", available: false },
    ],
  },
  {
    name: "BASIC",
    id: "BASIC",
    icon: Rocket,
    tokens: 40,
    options: [
      { duration: 1, price: 9.99 },
      { duration: 6, price: 30.99 },
    ],
    limits: { maxQuestionsPerQuiz: 5 },
    features: [
      { name: "Multiple Choice Questions Generator", available: true },
      { name: "Fill in the Blanks Questions", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Coding Quiz Generator", available: false },
      { name: "Quiz from Video Transcript", available: false },
      { name: "PDF Downloads (All Quizzes & Transcripts)", available: true },
      { name: "Video Transcripts", available: true },
      { name: "Document to Quiz Converter (Coming Soon)", available: false, comingSoon: true },
      { name: "Enhanced AI Accuracy", available: true },
      { name: "Priority Support", available: false },
    ],
  },
  {
    name: "PRO",
    id: "PRO",
    icon: Zap,
    tokens: 100,
    options: [
      { duration: 1, price: 19.99 },
      { duration: 6, price: 49.99 },
    ],
    limits: { maxQuestionsPerQuiz: 15 },
    features: [
      { name: "Multiple Choice Questions Generator", available: true },
      { name: "Fill in the Blanks Questions", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Coding Quiz Generator", available: true },
      { name: "Quiz from Video Transcript", available: true },
      { name: "PDF Downloads (All Quizzes & Transcripts)", available: true },
      { name: "Video Transcripts", available: true },
      { name: "Document to Quiz Converter (Coming Soon)", available: false, comingSoon: true },
      { name: "Enhanced AI Accuracy", available: true },
      { name: "Priority Support", available: true },
    ],
  },
  {
    name: "ULTIMATE",
    id: "ULTIMATE",
    icon: Crown,
    tokens: 200,
    options: [
      { duration: 1, price: 34.99 },
      { duration: 6, price: 99.99 },
    ],
    limits: { maxQuestionsPerQuiz: 20 },
    features: [
      { name: "Multiple Choice Questions Generator", available: true },
      { name: "Fill in the Blanks Questions", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Coding Quiz Generator", available: true },
      { name: "Quiz from Video Transcript", available: true },
      { name: "PDF Downloads (All Quizzes & Transcripts)", available: true },
      { name: "Video Transcripts", available: true },
      { name: "Document to Quiz Converter (Coming Soon)", available: false, comingSoon: true },
      { name: "Enhanced AI Accuracy", available: true },
      { name: "Priority Support", available: true },
    ],
  },
]

export type SubscriptionPlanType = (typeof SUBSCRIPTION_PLANS)[number]["id"]

export type SubscriptionStatusType = "ACTIVE" | "INACTIVE" | "PENDING" | "CANCELLED" | null

export const FAQ_ITEMS = [
  {
    question: "What are tokens?",
    answer: "Tokens are a flexible currency you can use across different features.",
  },
  {
    question: "How many tokens do I get?",
    answer: "The number of tokens you get depends on your subscription plan.",
  },
  {
    question: "What can I use tokens for?",
    answer: "You can use tokens to create courses or generate quizzes.",
  },
  {
    question: "What happens if I run out of tokens?",
    answer: "You can upgrade your subscription plan to get more tokens.",
  },
]

