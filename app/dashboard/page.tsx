
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
        <EnhancedErrorBoundary
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h1>
                <p className="text-gray-600 mb-6">We encountered an error while loading the dashboard.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Reload Page
                </button>
              </div>
            </div>
          }
        >
          <CourseListWithFilters url={url} userId={userId} />
        </EnhancedErrorBoundary>
      </ClientOnly>
    </div>
  )
}
