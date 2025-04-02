import LandingComponent from "@/components/landing/LandingComponent"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CourseAI: AI Course Creator | Free Quiz, MCQ, Flashcard Generator",
  description:
    "Create professional courses instantly with CourseAI. Our free AI generator builds customized learning materials, MCQs, open-ended questions, quizzes, and flashcards tailored to your needs.",
  keywords: [
    "AI course creator", 
    "free quiz generator", 
    "MCQ creator", 
    "open-ended questions", 
    "flashcard generator", 
    "CourseAI", 
    "free learning platform", 
    "custom course generation"
  ],
  openGraph: {
    title: "CourseAI: Free AI Course & Quiz Generator | MCQs, Flashcards & More",
    description: "Generate professional courses for free with our AI technology. Create customized MCQs, open-ended questions, quizzes, and interactive flashcards instantly.",
    url: "https://courseai.example.com",
    siteName: "CourseAI",
    images: [
      {
        url: "https://courseai.example.com/og-image.jpg",
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
    description: "Generate professional courses for free. Create customized MCQs, open-ended questions, quizzes, and interactive flashcards instantly.",
    images: ["https://courseai.example.com/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow p-2 md:p-4">
        <LandingComponent />
      </div>
    </div>
  )
}

export default HomePage