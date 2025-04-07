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


  return (
    <div className="flex flex-col min-h-screen">
     
      <JsonLd type="default" />
      <div className="flex-grow p-2 md:p-4">
        <LandingComponent />
      </div>
    </div>
  )
}

export default HomePage

