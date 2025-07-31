import CourseAILandingPage from "@/components/landing/CourseAILandingPage"

import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper"
import { generateMetadata, JsonLD } from "@/lib/seo"

export const metadata = generateMetadata({
  title: 'Home',
  description: 'Welcome to AI Learning - your platform for mastering artificial intelligence',
})

export default function HomePage() {
  return (
    <PageWrapper>
      <PageHeader title={""} description={""}>
        <JsonLD
          type="website"
          data={{
            name: 'AI Learning Platform',
            url: 'https://courseai.io',
          }}
        />
        <CourseAILandingPage />
      </PageHeader>
    </PageWrapper>
  )
}
