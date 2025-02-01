import { Suspense } from "react";
import { fetchCourses } from "@/lib/db";
import CourseListSkeleton from "./components/CourseListSkeleton";
import CourseList from "./components/CourseLists";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await fetchCourses();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary"> Available Courses</h1>
         
        <Suspense fallback={<CourseListSkeleton />}>
          <CourseList initialCourses={courses} />
        </Suspense>
      </div>
    </div>
  );
}