import QuizCreationPage from "@/components/QuizCreationPage"
import type { Metadata } from "next"


export const metadata: Metadata = {
  title: "Free Multiple Choice Quiz Generator",
  description: "Create interactive multiple choice quizzes to test knowledge on any programming topic.",
  keywords: [
    "multiple choice quiz",
    "programming quiz",
    "coding questions",
    "tech assessment",
    "developer quiz",
    "interactive test",
  ],
  openGraph: {
    title: "Free Multiple Choice Quiz Generator",
    description: "Create interactive multiple choice quizzes to test knowledge on any programming topic.",
    url: "https://courseai.io/dashboard/mcq",
    type: "website",
    images: [{ url: "/og-image-mcq.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Multiple Choice Quiz Generator",
    description: "Create interactive multiple choice quizzes to test knowledge on any programming topic.",
    images: ["/twitter-image-mcq.jpg"],
  },
}

const Page = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // CreativeWork schema
  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Multiple Choice Quiz Creator",
    description: "Create interactive multiple choice quizzes to test knowledge on any programming topic.",
    creator: {
      "@type": "Organization",
      name: "Course AI",
    },
    url: `${baseUrl}/dashboard/mcq`,
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
        name: "Multiple Choice Quiz",
        item: `${baseUrl}/dashboard/mcq`,
      },
    ],
  }

  return (
    <QuizCreationPage
      type="mcq"
      title="Multiple Choice Quiz"
      metadata={{
        creativeWorkSchema,
        breadcrumbSchema,
      }}
    />
  )
}

export default Page

