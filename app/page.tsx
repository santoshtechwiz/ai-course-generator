import CourseAILandingPage from "@/components/landing/CourseAILandingPage"

import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper"
import { JsonLD, DefaultSEO } from "@/lib/seo"
import { generateOptimizedMetadata } from "@/lib/seo"

export const metadata = generateOptimizedMetadata({
  title: 'AI-Powered Course & Quiz Creator - Learn, Teach, Test Anything',
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
  canonicalPath: '/',
  type: 'website',
})

export default function HomePage() {
  return (
    <PageWrapper>
      <PageHeader title={""} description={""}>
        <DefaultSEO 
          enableWebsite={true}
          enableOrganization={true}
          enableBreadcrumbs={false}
          currentPath="/"
        />
        <JsonLD
          type="WebSite"
          data={{
            "@type": "WebSite",
            "name": "CourseAI",
            "alternateName": ["Course AI", "AI Learning Platform"],
            "url": "https://courseai.io",
            "description": "AI-powered educational content creation platform for courses and quizzes",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://courseai.io/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "publisher": {
              "@type": "Organization",
              "name": "CourseAI",
              "logo": "https://courseai.io/logo.png"
            }
          }}
        />
        <CourseAILandingPage />
      </PageHeader>
    </PageWrapper>
  )
}
