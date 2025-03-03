export const metadata = {
  title: "Explore Courses | Course AI",
  description: "Discover a wide range of interactive courses and quizzes tailored to enhance your learning experience.",
}

import CourseList from "@/components/features/home/CourseLists"
import CourseListSkeleton from "@/components/features/home/CourseListSkeleton"
import { getAuthSession } from "@/lib/authOptions"
import { Suspense } from "react"

const url = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/create`
  : "http://localhost:3000/dashboard/create"

export default async function CoursesPage() {
  const session = await getAuthSession()
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Discover Engaging Courses</h1>

      <Suspense fallback={<CourseListSkeleton />}>
        <CourseList url={url} userId={session?.user?.id} />
      </Suspense>
    </div>
  )
}

