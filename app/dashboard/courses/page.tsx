import { Suspense } from "react"

import SearchBar from "./components/SearchBar"
import CourseListSkeleton from "./components/CourseListSkeleton"
import { fetchCourses } from "@/lib/db"
import CoursesList from "./components/CourseList"
export const dynamic = 'force-dynamic'
export default async function CoursesPage() {
  const courses = await fetchCourses();

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
          Available Courses
        </h1>
        <SearchBar />
        <Suspense fallback={<CourseListSkeleton />}>
          <CoursesList initialCourses={courses} />
        </Suspense>
      </div>
    </div>
  )
}
