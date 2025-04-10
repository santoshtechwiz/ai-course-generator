import QuizCreationPage from "@/components/QuizCreationPage"
import type { Metadata } from "next"


export const metadata: Metadata = {
  title: "Free Open-Ended Quizzes Generator",
  description:
    "Develop critical thinking skills with our thought-provoking open-ended quizzes. Perfect for in-depth learning and self-expression.",
  keywords: [
    "open-ended questions",
    "critical thinking",
    "essay questions",
    "programming challenges",
    "coding problems",
    "developer assessment",
  ],
  openGraph: {
    title: "Open-Ended Quizzes Generator",
    description:
      "Develop critical thinking skills with our thought-provoking open-ended quizzes. Perfect for in-depth learning and self-expression.",
    url: "https://courseai.io/dashboard/openended",
    type: "website",
    images: [{ url: "/og-image-openended.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open-Ended Quizzes Generator",
    description:
      "Develop critical thinking skills with our thought-provoking open-ended quizzes. Perfect for in-depth learning and self-expression.",
    images: ["/twitter-image-openended.jpg"],
  },
}

const Page = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // CreativeWork schema
  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Open-Ended Quiz Creator",
    description:
      "Develop critical thinking skills with our thought-provoking open-ended quizzes. Perfect for in-depth learning and self-expression.",
    creator: {
      "@type": "Organization",
      name: "Course AI",
    },
    url: `${baseUrl}/dashboard/openended`,
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
        name: "Open-Ended Quizzes",
        item: `${baseUrl}/dashboard/openended`,
      },
    ],
  }

  return (
    <QuizCreationPage
      type="openended"
      title="Open-Ended Quiz"
      metadata={{
        creativeWorkSchema,
        breadcrumbSchema,
      }}
    />
  )
}

export default Page

