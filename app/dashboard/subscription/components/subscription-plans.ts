/**
 * Subscription Plans Configuration
 *
 * This file contains the configuration for all subscription plans.
 * It's separated from the business logic to make it easier to modify
 * plan details without changing the core functionality.
 */

import { AddOnPackage, FAQItem, SubscriptionPlan} from "@/app/dashboard/subscription/types/subscription"
import { CreditCard, Zap, Rocket, Crown } from "lucide-react"

// Define all subscription plans
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
      { name: "Course Creation", available: true },
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },
      { name: "Video Transcripts", available: true },
      { name: "Video Quiz", available: true },
      { name: "PDF Downloads", available: true },
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
      { name: "Course Creation", available: true },
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },
      { name: "Video Transcripts", available: true },
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
      { name: "Course Creation", available: true },
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },
      { name: "Video Transcripts", available: true },
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
      { name: "Course Creation", available: true },
      { name: "MCQ Generator", available: true },
      { name: "Fill in the Blanks", available: true },
      { name: "Open-ended Questions", available: true },
      { name: "Code Quiz", available: true },
      { name: "Video Transcripts", available: true },
      { name: "Video Quiz", available: true },
      { name: "PDF Downloads", available: true },
      { name: "Video Transcripts", available: true },
      { name: "AI Accuracy", available: true },
      { name: "Priority Support", available: true },
    ],
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
];
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

