import { Suspense } from "react";

import CourseListSkeleton from "./components/CourseListSkeleton";
import CourseList from "./components/CourseLists";
import { fetchCourses } from "@/app/actions/fetchCourses";

import { getAuthSession } from "@/lib/authOptions";

export const dynamic = "force-dynamic";
const url=`${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/create` || "http://localhost:3000/dashboard/create";
export default async function CoursesPage() {
  const userId=(await getAuthSession())?.user.id;
  const courses = (await fetchCourses({}, userId)) || [];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary"> Available Courses</h1>
         
        <Suspense fallback={<CourseListSkeleton />}>
          <CourseList initialCourses={courses} url={url} />
        </Suspense>
      </div>
    </div>
  );
}