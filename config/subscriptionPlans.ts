import { Star, Rocket, Zap, Crown } from "lucide-react"



type SubscriptionPlan = {
  name: string;
  id: "FREE" | "BASIC" | "PRO" | "ULTIMATE";
  icon: React.ComponentType;
  tokens: number;
  options: { duration: number; price: number }[];
  limits: { maxQuestionsPerQuiz: number };
  features: { name: string; available: boolean }[];
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    name: "Starter",
    id: "FREE",
    icon: Star,
    tokens: 5,
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
      { name: "Convert Document to Quiz", available: false },
      { name: "AI Accuracy", available: false },
      { name: "Priority Support", available: false },
    ],
  },
  {
    name: "Learner",
    id: "BASIC",
    icon: Rocket,
    tokens: 40,
    options: [
      { duration: 1, price: 9.99 },
      { duration: 6, price: 30.99 },
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
      { name: "Convert Document to Quiz", available: false },
      { name: "AI Accuracy", available: true },
      { name: "Priority Support", available: false },
    ],
  },
  {
    name: "Pro",
    id: "PRO",
    icon: Zap,
    tokens: 100,
    options: [
      { duration: 1, price: 19.99 },
      { duration: 6, price: 49.99 },
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
      { name: "Convert Document to Quiz", available: false },
      { name: "AI Accuracy", available: true },
      { name: "Priority Support", available: true },
    ],
  },
  {
    name: "Ultimate",
    id: "ULTIMATE",
    icon: Crown,
    tokens: 200,
    options: [
      { duration: 1, price: 34.99 },
      { duration: 6, price: 99.99 },
    ],
    limits: { maxQuestionsPerQuiz: 20 },
    features: [
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },

      { name: "PDF Downloads (All Quiz and Video Transcript)", available: true },
      { name: "Video Transcripts", available: true },
      { name: "AI Accuracy", available: true },
      { name: "Convert Document to Quiz", available: false },
      { name: "Priority Support", available: true },
    ],
  },
];

export type SubscriptionPlanType = typeof SUBSCRIPTION_PLANS[number]['id'];

export type SubscriptionStatusType = "ACTIVE" | "INACTIVE" | "PENDING" | "CANCELLED" | null;

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

