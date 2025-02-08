import { Suspense } from "react"

import { getAuthSession } from "@/lib/authOptions"
import CourseList from "../components/courses/CourseLists"
import CourseListSkeleton from "../components/courses/CourseListSkeleton"



export const dynamic = "force-dynamic"
export const revalidate = 0

const url = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/create`
  : "http://localhost:3000/dashboard/create"

export default async function CoursesPage() {
  const session = await getAuthSession()



  return (
    <div className="min-h-screen">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <Suspense fallback={<CourseListSkeleton />}>
            <CourseList url={url} userId={session?.user?.id} />
          </Suspense>
  
      </div>
    </div>
  )
}
