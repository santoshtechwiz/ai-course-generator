export const SUBSCRIPTION_PLANS = [
  {
    name: "FREE",
    options: [{ duration: 1, price: 0 }],
    tokens: 3,
    limits: {
      courses: 1,
      mcq: 3,
      openEnded: 3,
      fillInTheBlanks: 3,
    },
    features: [
      "1 course",
      "Up to 5 sections per course",
      "Basic MCQ quiz support",
      "Basic Fill-in-the-Blank quiz support",
      "Basic open-ended quiz support",
    ],
  },
  {
    name: "BASIC",
    options: [
      { duration: 1, price: 9.99 },
      { duration: 6, price: 49.99 },
    ],
    tokens: 10,
    limits: {
      courses: Number.POSITIVE_INFINITY,
      mcq: 10,
      openEnded: 5,
      fillInTheBlanks: 5,
    },
    features: [
      "Unlimited courses",
      "Up to 5 sections per course",
      "Video transcripts",
      "Video quizzes",
      "Enhanced MCQ quizzes",
      "Enhanced Fill-in-the-Blank quizzes",
      "Enhanced open-ended quizzes",
    ],
  },
  {
    name: "PRO",
    options: [
      { duration: 1, price: 19.99 },
      { duration: 6, price: 99.99 },
    ],
    tokens: 50,
    limits: {
      courses: Number.POSITIVE_INFINITY,
      sectionsPerCourse: 20,
      mcq: 15,
      openEnded: 15,
      fillInTheBlanks: 15,
    },
    features: [
      "Unlimited courses",
      "Up to 20 sections per course",
      "Video transcripts",
      "Video quizzes",
      "Advanced MCQ quizzes",
      "Advanced Fill-in-the-Blank quizzes",
      "Advanced open-ended quizzes",
    ],
  },
] as const

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

