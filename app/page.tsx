import CourseAILandingPage from "@/components/landing/CourseAILandingPage"

import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper"
import { 
  generateEnhancedMetadata,
  EnhancedSEOProvider,
  EnhancedWebsiteSchemaComponent,
  EnhancedOrganizationSchemaComponent,
  EnhancedFAQSchemaComponent
} from "@/lib/seo"

export const metadata = generateEnhancedMetadata({
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
    <PageWrapper>
      <PageHeader title={""} description={""}>
        {/* Enhanced SEO with all required schemas including optimized FAQ */}
        <EnhancedSEOProvider
          enableWebsite={true}
          enableOrganization={true}
          enableFAQ={true}
          enableBreadcrumbs={false}
          currentPath="/"
        >
          <CourseAILandingPage />
        </EnhancedSEOProvider>
      </PageHeader>
    </PageWrapper>
  )
}
