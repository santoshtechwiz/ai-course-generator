"use client";

import { Suspense } from "react";
import type { FullCourseType } from "@/app/types/types";
import MainContent from "./MainContent";

export default function CourseContent({ course }: { course: FullCourseType }) {
  return (
    <Suspense fallback={<div>Loading course content...</div>}>
      {/* Directly render MainContent without subscription check */}
      <MainContent course={course} />
    </Suspense>
  );
}
