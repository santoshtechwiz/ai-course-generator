import CourseAILandingPage from "@/components/landing/CourseAILandingPage"
import { ModuleLayout } from "@/components/layout/ModuleLayout"
import { PageHeader } from "@/components/layout/PageWrapper"
import { generateMetadata } from "@/lib/seo"
import { JsonLD } from "@/lib/seo"

export const metadata = generateMetadata({
  title: 'CourseAI - AI-Powered Course & Quiz Creator',
  description: 'Create professional educational content with AI. Generate interactive courses, MCQ quizzes, and assessments for any topic. Perfect for educators, trainers, and lifelong learners.',
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
    'automated content generation'
  ],
  canonical: '/',
  type: 'website',
})

export default function HomePage() {
  return (
    <ModuleLayout>
      <PageHeader title={""} description={""}>
        <CourseAILandingPage />
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
