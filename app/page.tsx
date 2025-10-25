import CourseAILandingPage from "@/components/landing/CourseAILandingPage"
import { Suspense } from "react"
import { SuspenseGlobalFallback } from "@/components/loaders"
import { ModuleLayout } from "@/components/layout/ModuleLayout"
import { PageHeader } from "@/components/layout/PageWrapper"
import { generateMetadata } from "@/lib/seo"
import { JsonLD } from "@/lib/seo"

export const metadata = generateMetadata({
  title: "CourseAI - Create Interactive Courses and Quizzes",
  description:
    "Build video-based courses with structured learning paths and generate intelligent quizzes. Create engaging educational content with AI assistance for personalized learning experiences.",
  keywords: [
    "course creation platform",
    "quiz generator",
    "video course builder",
    "interactive learning platform",
    "AI quiz maker",
    "learning management",
    "educational technology",
    "course builder",
    "quiz maker",
    "online learning platform",
    "e-learning tools",
    "courseai",
    "automated quiz generation",
    "learning path creator",
  ],
  canonical: "/",
  type: "website",
  image: "/images/og-image.png", // Add proper OG image path
})

export default function HomePage() {
  return (
    <ModuleLayout>
      <PageHeader title={""} description={""}>
        <Suspense fallback={<SuspenseGlobalFallback text="Loading home…" />}>
          <CourseAILandingPage />
        </Suspense>
      </PageHeader>

      {/* Add structured data for better SEO */}
      <JsonLD
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "CourseAI",
          description: "AI-powered platform for creating video courses and generating intelligent quizzes",
          applicationCategory: "EducationalApplication",
          operatingSystem: "All",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }}
        type={""}
      />
    </ModuleLayout>
  )
}
