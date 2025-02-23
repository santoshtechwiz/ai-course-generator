import { Star, Rocket, Zap, Crown } from "lucide-react"

export type SubscriptionPlanType = "FREE" | "BASIC" | "PRO" | "ULTIMATE"

export type SubscriptionStatusType = "ACTIVE" | "INACTIVE" | "PENDING" | "CANCELLED"


export const SUBSCRIPTION_PLANS = [
  {
    name: "FREE",
    id: "FREE",
    icon: Star,
    tokens: 5,  // Increased from 3 → 5
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
    tokens: 40,  // Increased from 20 → 40
    options: [
      { duration: 1, price: 9.99 },  // Lowered from $14.99 to be more competitive
      { duration: 6, price: 30.99 }, // Lowered from $74.99
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
    tokens: 100,  // Increased from 60 → 100
    options: [
      { duration: 1, price: 19.99 },  // Lowered from $29.99 to attract more buyers
      { duration: 6, price: 49.99 },  // Slightly adjusted for value
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
    tokens: 200,  // Increased from 150 → 250
    options: [
      { duration: 1, price: 34.99 },  // Lowered from $49.99 to stay competitive
      { duration: 6, price: 99.99 }, // Adjusted for value
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

