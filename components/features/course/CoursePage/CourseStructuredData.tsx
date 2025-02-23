import {  FullCourseType } from "@/app/types/types";


interface CourseStructuredDataProps {
  course: FullCourseType;
}

export default function CourseStructuredData({ course }: CourseStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "AI Learning Platform",
      sameAs: process.env.NEXT_PUBLIC_BASE_URL,
    },
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/course/${course.slug}`,
    inLanguage: "en",
    image: course.imageUrl || "/default-course-image.jpg",
    courseCode: course.slug,
    numberOfCredits: course?.courseUnits?.length,
    educationalLevel: "Beginner",
    teaches: course?.courseUnits?.map(unit => unit.name).join(", "),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

