import LandingComponent from "@/components/landing/LandingComponent"
import type { Metadata } from "next"
import { JsonLd } from "@/app/schema/components/json-ld"

export const metadata: Metadata = {
  title: "CourseAI: AI Course Creator | Free Quiz, MCQ, Flashcard Generator",
  description:
    "Create professional programming courses instantly with CourseAI. Our free AI generator builds customized learning materials, MCQs, open-ended questions, quizzes, and flashcards tailored to your coding education needs.",
  keywords: [
    "AI course creator",
    "free quiz generator",
    "MCQ creator",
    "open-ended questions",
    "flashcard generator",
    "CourseAI",
    "free learning platform",
    "custom course generation",
    "programming education",
    "coding quizzes",
    "developer learning",
    "tech education",
    "AI learning platform",
    "interactive coding lessons",
    "programming practice",
  ],
  openGraph: {
    title: "CourseAI: Free AI Course & Quiz Generator | MCQs, Flashcards & More",
    description:
      "Generate professional programming courses for free with our AI technology. Create customized MCQs, open-ended questions, quizzes, and interactive flashcards instantly.",
    url: "https://courseai.io",
    siteName: "CourseAI",
    images: [
      {
        url: "https://courseai.io/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CourseAI - Free AI Course Creator with Quiz, MCQ & Flashcard Generator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CourseAI: Free AI Course & Quiz Generator | MCQs, Flashcards & More",
    description:
      "Generate professional programming courses for free. Create customized MCQs, open-ended questions, quizzes, and interactive flashcards instantly.",
    images: ["https://courseai.io/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

const HomePage = () => {
  // FAQ items for the homepage
  const faqItems = [
    {
      question: "What is CourseAI?",
      answer:
        "CourseAI is an AI-powered platform that helps you create professional programming courses, quizzes, flashcards, and learning materials instantly. Our tools use advanced AI to generate customized educational content tailored to your specific needs.",
    },
    {
      question: "Is CourseAI free to use?",
      answer:
        "Yes, CourseAI offers a free tier that gives you access to essential features. We also offer premium plans with advanced features for more demanding educational needs.",
    },
    {
      question: "What types of content can I create with CourseAI?",
      answer:
        "You can create full programming courses, multiple-choice questions (MCQs), open-ended questions, interactive quizzes, flashcards, and other educational materials focused on coding and development skills.",
    },
    {
      question: "How does the AI generate programming content?",
      answer:
        "Our AI analyzes vast amounts of programming knowledge to create accurate, relevant, and engaging educational content. It can generate questions, explanations, code examples, and learning materials across various programming languages and concepts.",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd type="faq" data={faqItems} />
      <JsonLd type="default" />
      <div className="flex-grow p-2 md:p-4">
        <LandingComponent />
      </div>
    </div>
  )
}

export default HomePage

