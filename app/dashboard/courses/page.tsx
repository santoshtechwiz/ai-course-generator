import { Suspense } from "react"
import CourseListSkeleton from "./components/CourseListSkeleton"

import { fetchCourses } from "@/app/actions/fetchCourses"
import { getAuthSession } from "@/lib/authOptions"
import CourseList from "./components/CourseLists"

export const dynamic = "force-dynamic"
export const revalidate = 0

const url = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/create`
  : "http://localhost:3000/dashboard/create"

export default async function CoursesPage() {
  const session = await getAuthSession()
  const courses = await fetchCourses({}, session?.user?.id)

  return (
    <div className="min-h-screen">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<CourseListSkeleton />}>
          <CourseList initialCourses={courses || []} url={url} />
        </Suspense>
      </div>
    </div>
  )
}

