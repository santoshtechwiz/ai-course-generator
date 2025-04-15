import QuizCreationPage from "@/app/dashboard/(quiz)/(components)/QuizCreationPage"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Fill in the Blanks Quizzes | Course AI",
  description:
    "Enhance your learning with our interactive fill-in-the-blanks quizzes. Perfect for improving vocabulary, grammar, and subject-specific knowledge.",
  keywords: [
    "fill in the blanks",
    "cloze test",
    "programming practice",
    "code completion",
    "syntax learning",
    "interactive exercises",
  ],
  openGraph: {
    title: "Fill in the Blanks Quizzes | Course AI",
    description:
      "Enhance your learning with our interactive fill-in-the-blanks quizzes. Perfect for improving vocabulary, grammar, and subject-specific knowledge.",
    url: "https://courseai.io/dashboard/blanks",
    type: "website",
    images: [{ url: "/og-image-blanks.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fill in the Blanks Quizzes | Course AI",
    description:
      "Enhance your learning with our interactive fill-in-the-blanks quizzes. Perfect for improving vocabulary, grammar, and subject-specific knowledge.",
    images: ["/twitter-image-blanks.jpg"],
  },
}

const Page = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // CreativeWork schema
  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Fill in the Blanks Quiz Creator",
    description:
      "Enhance your learning with our interactive fill-in-the-blanks quizzes. Perfect for improving vocabulary, grammar, and subject-specific knowledge.",
    creator: {
      "@type": "Organization",
      name: "Course AI",
    },
    url: `${baseUrl}/dashboard/blanks`,
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
        name: "Fill in the Blanks Quizzes",
        item: `${baseUrl}/dashboard/blanks`,
      },
    ],
  }

  return (
    <QuizCreationPage
      type="fill-in-the-blanks"
      title="Fill in the Blanks Quiz"
      metadata={{
        creativeWorkSchema,
        breadcrumbSchema,
      }}
    />
  )
}

export default Page

