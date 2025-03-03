import { notFound } from "next/navigation"
import { getCourseData } from "@/app/actions/getCourseData"
import type { Metadata, ResolvingMetadata } from "next"
import CoursePage from "@/components/features/course/CoursePage/CoursePage"
import CourseStructuredData from "@/components/features/course/CoursePage/CourseStructuredData"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
const SITE_NAME = "CourseAI"

// Loading Skeleton for better UX
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="w-full aspect-video rounded-lg" />
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  )
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const course = await getCourseData((await params).slug)

  if (!course) {
    return {
      title: "Course Not Found ",
      description: "The requested course is not available. Explore our other AI-powered courses at CourseAI.",
      robots: "noindex, nofollow",
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  const courseUrl = `${SITE_URL}/courses/${(await params).slug}`
  const imageUrl = course.image || `${SITE_URL}/default-course-thumbnail.png`

  const defaultKeywords = [
    "AI-powered learning",
    "personalized education",
    "online course",
    "e-learning",
    "skill development",
    "interactive learning",
  ]

  const courseDescription =
    course.description ||
    `Master ${course.name} with our AI-powered, personalized online course. Gain practical skills, complete interactive quizzes, and earn a certificate.`

  return {
    title: `${course.name} | AI-Powered Online Course`,
    description: `${courseDescription.slice(0, 155)}... Enroll now at ${SITE_NAME} for a personalized learning experience.`,
    keywords: [...new Set([...defaultKeywords, course.name, SITE_NAME])],
    category: "Education",
    openGraph: {
      title: `Master ${course.name} - AI-Powered Online Course `,
      description: courseDescription,
      url: courseUrl,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${course.name} Course Thumbnail - AI-Powered Learning`,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Learn ${course.name} with AI | ${SITE_NAME}`,
      description: `${courseDescription.slice(0, 180)}... Enroll now for personalized, AI-driven learning!`,
      images: [imageUrl],
      creator: "@courseai",
    },
    alternates: {
      canonical: courseUrl,
    },
    other: {
      "og:locale": "en_US",
      "og:type": "course",
      "og:price:currency": "USD",
    },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug
  const course = await getCourseData(slug)

  if (!course) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <CourseStructuredData course={course} />
        <CoursePage course={course} />
      </Suspense>
    </div>
  )
}

