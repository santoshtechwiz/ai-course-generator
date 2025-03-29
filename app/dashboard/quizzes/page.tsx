import { Suspense } from "react"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/authOptions"

import { getQuizzes } from "@/app/actions/getQuizes"
import { QuizzesClient } from "@/components/features/quizzes/QuizzesClient"
import { QuizzesSkeleton } from "@/components/features/quizzes/QuizzesSkeleton"

export const metadata: Metadata = {
  title: "Explore Quizzes | Course AI",
  description: "Discover a variety of interactive quizzes to test and enhance your programming knowledge and skills.",
  keywords: [
    "programming quizzes",
    "coding tests",
    "developer assessments",
    "interactive quizzes",
    "tech knowledge tests",
    "coding challenges",
  ],
  openGraph: {
    title: "Explore Quizzes | Course AI",
    description: "Discover a variety of interactive quizzes to test and enhance your programming knowledge and skills.",
    url: "https://courseai.io/dashboard/quizzes",
    type: "website",
    images: [{ url: "/og-image-quizzes.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Quizzes | Course AI",
    description: "Discover a variety of interactive quizzes to test and enhance your programming knowledge and skills.",
    images: ["/twitter-image-quizzes.jpg"],
  },
}

export const dynamic = "force-dynamic"

const QuizPage = async () => {
  const session = await getAuthSession()
  const userId = session?.user?.id
  const initialQuizzesData = await getQuizzes({ page: 1, limit: 5, searchTerm: "", userId: userId, quizTypes: [] })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // CollectionPage schema
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Explore Quizzes",
    description: "Discover a variety of interactive quizzes to test and enhance your programming knowledge and skills.",
    url: `${baseUrl}/dashboard/quizzes`,
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
      {
        "@type": "ListItem",
        position: 3,
        name: "Quizzes",
        item: `${baseUrl}/dashboard/quizzes`,
      },
    ],
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Explore Quizzes</h1>
      <Suspense fallback={<QuizzesSkeleton />}>
        <QuizzesClient initialQuizzesData={initialQuizzesData} userId={userId} />
      </Suspense>
    </div>
  )
}

export default QuizPage

