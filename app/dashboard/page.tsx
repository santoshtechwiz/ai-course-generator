import { Suspense } from "react"

import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper"
import { getAuthSession } from "@/lib/auth"

import ClientOnly from "@/components/ClientOnly"
import CourseListWithFilters from "@/components/features/home/CourseListWithFilters"

export const dynamic = 'force-dynamic'

const url = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/explore`
  : "http://localhost:3000/dashboard/explore"

export default async function CoursesPage() {
  const session = await getAuthSession()
  const userId = session?.user?.id

  return (
    <PageWrapper>
      <PageHeader title="Explore Courses" description={""}>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-center">
          Discover interactive quizzes designed to enhance your learning experience and test your knowledge
        </p>
        <ClientOnly>
          <CourseListWithFilters url={url} userId={userId} />
        </ClientOnly>
      </PageHeader>
    </PageWrapper>
  )
}
