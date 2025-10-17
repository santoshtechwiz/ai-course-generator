
import { getAuthSession } from "@/lib/auth"

import ClientOnly from "@/components/ClientOnly"
import CourseListWithFilters from "@/components/features/home/CourseListWithFilters"
import { EnhancedErrorBoundary } from "@/components/error-boundary"

export const dynamic = 'force-dynamic'

const url = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/explore`
  : "http://localhost:3000/dashboard/explore"

export default async function CoursesPage() {
  const session = await getAuthSession()
  const userId = session?.user?.id

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientOnly>
        <EnhancedErrorBoundary>
          <CourseListWithFilters url={url} userId={userId} />
        </EnhancedErrorBoundary>
      </ClientOnly>
    </div>
  )
}
