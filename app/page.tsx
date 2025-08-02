import CourseAILandingPage from "@/components/landing/CourseAILandingPage"

import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper"
import { generateMetadata } from "@/lib/seo"

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
    <PageWrapper>
      <PageHeader title={""} description={""}>
        <CourseAILandingPage />
      </PageHeader>
    </PageWrapper>
  )
}
