export const metadata = {
  title: "Explore Courses | Course AI",
  description: "Discover a wide range of interactive courses and quizzes tailored to enhance your learning experience.",
  keywords: [
    "programming courses",
    "interactive learning",
    "coding education",
    "tech courses",
    "developer education",
    "AI learning platform",
  ],
  openGraph: {
    title: "Explore Courses | Course AI",
    description:
      "Discover a wide range of interactive courses and quizzes tailored to enhance your learning experience.",
    url: "https://courseai.dev/dashboard",
    type: "website",
    images: [{ url: "/og-image-dashboard.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Courses | Course AI",
    description:
      "Discover a wide range of interactive courses and quizzes tailored to enhance your learning experience.",
    images: ["/twitter-image-dashboard.jpg"],
  },
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  // CollectionPage schema
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Explore Courses",
    description:
      "Discover a wide range of interactive courses and quizzes tailored to enhance your learning experience.",
    url: `${baseUrl}/dashboard`,
    isPartOf: {
      "@type": "WebSite",
      name: "Course AI",
      url: baseUrl,
    },
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Dashboard",
        item: `${baseUrl}/dashboard`,
      },
    ],
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Discover Engaging Courses</h1>

      <Suspense fallback={<CourseListSkeleton />}>
        <CourseList url={url} userId={session?.user?.id} />
      </Suspense>
    </div>
  )
}

