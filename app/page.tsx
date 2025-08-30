import CourseAILandingPage from "@/components/landing/CourseAILandingPage"
import { Suspense } from "react"
import { SuspenseGlobalFallback } from "@/components/loaders"
import { ModuleLayout } from "@/components/layout/ModuleLayout"
import { PageHeader } from "@/components/layout/PageWrapper"
import { generateMetadata } from "@/lib/seo"
import { JsonLD } from "@/lib/seo"

export const metadata = generateMetadata({
  title: 'CourseAI - Create Extraordinary Courses with AI',
  description: 'Transform any topic into engaging, interactive courses in minutes. CourseAI combines AI-powered content creation with beautiful design to help educators, trainers, and organizations create extraordinary learning experiences.',
  keywords: [
    'AI course creator',
    'AI quiz generator',
    'educational content creator',
    'interactive learning platform',
    'course builder',
    'quiz maker',
    'AI education tools',
    'online learning',
    'educational technology',
    'e-learning platform',
    'training materials',
    'assessment tools',
    'courseai',
    'automated content generation',
    'learning management system',
    'educational innovation',
    'AI-powered education',
    'course creation platform'
  ],
  canonical: '/',
  type: 'website',
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
          "name": "CourseAI",
          "description": "AI-powered educational content creator for courses and quizzes",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }} type={""}      />
    </ModuleLayout>
  )
}
