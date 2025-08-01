import CourseAILandingPage from "@/components/landing/CourseAILandingPage"

import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper"
import { JsonLD } from "@/lib/seo"
import { generateMetadata } from "@/lib/seo/seo-helper"


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
