import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCourseData } from "@/lib/db";

import CourseStructuredData from "../components/CoursePage/CourseStructuredData";
import { Skeleton } from "@/components/ui/skeleton";
import CoursePage from "../components/CoursePage/CoursePage";


function LoadingSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-4rem)] gap-4 p-4">
      <div className="flex-grow lg:w-3/4">
        <Skeleton className="w-full aspect-video rounded-lg" />
        <Skeleton className="h-[400px] w-full mt-4 rounded-lg" />
      </div>
      <div className="lg:w-1/4 lg:min-w-[300px]">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

export default async function Page({ params }: { params: { slug: string } }) {
  const slug = (await params).slug;
  const course = await getCourseData(slug);

  if (!course) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CourseStructuredData course={course} />
      <CoursePage course={course} />
    </Suspense>
  );
}
