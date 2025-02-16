import { Star, Rocket, Zap, Crown } from "lucide-react"

export type SubscriptionPlanType = "FREE" | "BASIC" | "PRO" | "ULTIMATE"

export type SubscriptionStatusType = "ACTIVE" | "INACTIVE" | "PENDING" | "CANCELLED"


export const SUBSCRIPTION_PLANS = [
  {
    name: "FREE",
    id: "FREE",
    icon: Star,
    tokens: 3,
    options: [{ duration: 1, price: 0 }],
    limits: { maxQuestionsPerQuiz: 3 },
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
    name: "BASIC",
    id: "BASIC",
    icon: Rocket,
    tokens: 20,
    options: [
      { duration: 1, price: 9.99 },
      { duration: 6, price: 49.99 },
    ],
    limits: { maxQuestionsPerQuiz: 5 },
    features: [
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: false },
      { name: "Video Quiz", available: false },
      { name: "PDF Downloads", available: true },
      { name: "Video Transcripts", available: true },
      { name: "AI Accuracy", available: true },
      { name: "Priority Support", available: false },
    ],
  },
  {
    name: "PRO",
    id: "PRO",
    icon: Zap,
    tokens: 60,
    options: [
      { duration: 1, price: 19.99 },
      { duration: 6, price: 99.99 },
    ],
    limits: { maxQuestionsPerQuiz: 15 },
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
  {
    name: "ULTIMATE",
    id: "ULTIMATE",
    icon: Crown,
    tokens: 150,
    options: [
      { duration: 1, price: 34.99 },
      { duration: 6, price: 179.99 },
    ],
    limits: { maxQuestionsPerQuiz: 20 },
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
];


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

