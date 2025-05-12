import CourseAILandingPage from "@/components/landing/CourseAILandingPage"
import type { Metadata } from "next"
import { JsonLd } from "@/app/schema/components/json-ld"
import { generatePageMetadata } from "@/lib/seo-utils"

export const metadata: Metadata = generatePageMetadata({
  title: "CourseAI: AI Course Creator | Free Quiz, MCQ, Flashcard Generator",
  description:
    "Create professional programming courses instantly with CourseAI. Our free AI generator builds customized learning materials, MCQs, open-ended questions, quizzes, and flashcards tailored to your coding education needs.",
  path: "/",
  keywords: [
    "AI course creator",
    "free quiz generator",
    "MCQ creator",
    "open-ended questions",
    "flashcard generator",
    "CourseAI",
    "free learning platform",
    "custom course generation",
    "coding quizzes",
    "developer learning",
    "tech education",
    "AI learning platform",
    "interactive coding lessons",
    "programming practice",
  ],
  ogType: "website",
  additionalMetaTags: [
    { name: "google-site-verification", content: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "" },
    { name: "application-name", content: "CourseAI" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    { name: "apple-mobile-web-app-title", content: "CourseAI" },
    { name: "format-detection", content: "telephone=no" },
    { name: "mobile-web-app-capable", content: "yes" },
  ],
})

const HomePage = () => {
  // Software application data for schema
  const softwareAppData = {
    name: "CourseAI",
    description: "AI-powered coding education platform with interactive courses, quizzes, and learning tools",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      ratingValue: "4.8",
      ratingCount: "250",
    },
  }

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd type="default" />
      <JsonLd type="softwareApplication" data={softwareAppData} />

      <div className="flex-grow">
        <CourseAILandingPage />
      </div>
    </div>
  )
}

export default HomePage
