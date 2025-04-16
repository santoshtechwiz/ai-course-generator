import type { Metadata } from "next"
import QuizCreationPage from "../components/QuizCreationPage"

export const metadata: Metadata = {
  title: "Code Challenges | Course AI",
  description: "Test and improve your programming skills with our interactive coding challenges and exercises.",
  keywords: [
    "coding challenges",
    "programming exercises",
    "code practice",
    "developer skills",
    "algorithm practice",
    "technical interview prep",
  ],
  openGraph: {
    title: "Code Challenges | Course AI",
    description: "Test and improve your programming skills with our interactive coding challenges and exercises.",
    url: "https://courseai.io/dashboard/code",
    type: "website",
    images: [{ url: "/og-image-code.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Challenges | Course AI",
    description: "Test and improve your programming skills with our interactive coding challenges and exercises.",
    images: ["/twitter-image-code.jpg"],
  },
}

const Page = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // CreativeWork schema
  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Code Challenge Creator",
    description: "Test and improve your programming skills with our interactive coding challenges and exercises.",
    creator: {
      "@type": "Organization",
      name: "Course AI",
    },
    url: `${baseUrl}/dashboard/code`,
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
        name: "Code Challenges",
        item: `${baseUrl}/dashboard/code`,
      },
    ],
  }

  return (
    <QuizCreationPage
      type="code"
      title="Code Challenge"
      metadata={{
        creativeWorkSchema,
        breadcrumbSchema,
      }}
    />
  )
}

export default Page

