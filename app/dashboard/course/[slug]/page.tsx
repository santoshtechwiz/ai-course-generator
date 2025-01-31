import { notFound } from "next/navigation";
import { Suspense } from "react";

import CourseStructuredData from "../components/CoursePage/CourseStructuredData";
import { Skeleton } from "@/components/ui/skeleton";
import CoursePage from "../components/CoursePage/CoursePage";
import { getCourseData } from "@/app/actions/getCourseData";
import type { Metadata, ResolvingMetadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
const SITE_NAME = "CourseAI"
// Loading Skeleton for better UX
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

// Generate dynamic metadata for SEO
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const course = await getCourseData(params.slug)

  if (!course) {
    return {
      title: "Course Not Found",
      description: "The course you are looking for does not exist.",
      robots: "noindex, nofollow",
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  const courseUrl = `${SITE_URL}/courses/${params.slug}`
  const imageUrl = course.imageUrl || `${SITE_URL}/default-thumbnail.png`

  return {
    title: `${course.name} | Online Course | ${SITE_NAME}`,
    description: `${course.description || "Learn more with this detailed course."} Enroll now at ${SITE_NAME}.`,
    keywords: [course.name, "online course", "e-learning", SITE_NAME],
    authors: [{ name: course.description || SITE_NAME }],
    category:  "Education",
    openGraph: {
      title: `${course.name} - Online Course | ${SITE_NAME}`,
      description: course.description || `Enhance your skills with our ${course.name} course. Join ${SITE_NAME} now!`,
      url: courseUrl,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${course.name} Course Thumbnail`,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.name} | ${SITE_NAME}`,
      description: `${course.description || `Learn ${course.name} online`} - Enroll now at ${SITE_NAME}!`,
      images: [imageUrl],
      creator: "@codeguru",
    },
    alternates: {
      canonical: courseUrl,
    },
    other: {
      "og:locale": "en_US",
      "og:type": "course",
      "og:price:amount": course.price?.toString() || "0",
      "og:price:currency": "USD",
    },
  }
}

// Main Course Page Component
export default async function Page({ params }: { params: { slug: string } }) {
  const slug = params.slug;
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
