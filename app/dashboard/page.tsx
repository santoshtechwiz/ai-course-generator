export const metadata = {
  title: "Explore Courses | Course AI",
  description: "Discover a wide range of interactive courses and quizzes tailored to enhance your learning experience.",
}

import CourseList from "@/components/features/home/CourseLists"
import { getAuthSession } from "@/lib/authOptions"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const url = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/explore`
  : "http://localhost:3000/dashboard/explore"

// Simple loading skeleton
const LoadingSkeleton = () => (
  <div className="p-4 md:p-6 lg:p-8">
    <Skeleton className="h-10 w-64 mx-auto mb-8" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-80 rounded-xl" />
      ))}
    </div>
  </div>
)

export default async function CoursesPage() {
  const session = await getAuthSession()
  return (
    <div className="min-h-screen">
      <div className="py-8 text-center">
        <h1 className="text-4xl font-bold text-primary">Explore Quizzes</h1>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CourseList url={url} userId={session?.user?.id} />
      </Suspense>
    </div>
  )
}
