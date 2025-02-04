import { Zap, Rocket, Star, Crown } from "lucide-react"


const SUBSCRIPTION_PLANS = [
  {
    name: "FREE",
    icon: Zap,
    options: [{ duration: 1, price: 0 }],
    tokens: 3,
    limits: {
    
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
     
      maxQuestionsPerQuiz: 15,
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
     
      maxQuestionsPerQuiz: 20,
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



const FAQ_ITEMS = [
  {
    question: "What are tokens and how do they work?",
    answer:
      "Tokens are our platform's currency for creating courses and quizzes. Each token allows you to create one course or generate one quiz, with the number of questions limited by your plan.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "Yes, you can change your plan at any time. If you upgrade, you'll have immediate access to the new features. If you downgrade, the changes will take effect at the start of your next billing cycle.",
  },
  {
    question: "What happens if I use all my tokens?",
    answer:
      "If you use all your tokens, you can purchase additional tokens or wait for your next billing cycle when your tokens will be refreshed.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied with our service, you can request a full refund within this period.",
  },
]
type SubscriptionPlanType = (typeof SUBSCRIPTION_PLANS)[number]["name"]
type SubscriptionStatusType = "ACTIVE" | "INACTIVE" | "CANCELLED"
export { SUBSCRIPTION_PLANS, FAQ_ITEMS, }