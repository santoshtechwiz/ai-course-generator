import { Suspense } from "react";
import { getAuthSession } from "@/lib/authOptions";
import CourseListSkeleton from "./components/CourseListSkeleton";
import CourseList from "./components/CourseLists";

const url = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/create`
  : "http://localhost:3000/dashboard/create";

export default async function CoursesPage() {
  const session = await getAuthSession();
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Explore Courses</h1>
      <Suspense fallback={<CourseListSkeleton />}>
        <CourseList url={url} userId={session?.user?.id} />
      </Suspense>
    </div>
  );
}