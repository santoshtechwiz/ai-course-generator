import { QuizCreationPage } from "@/components/QuizCommon"

export const metadata = {
  title: "Flashcards | Course AI",
  description:
    "Create and study with interactive flashcards to reinforce your programming knowledge and improve retention of key concepts.",
  keywords: [
    "flashcards",
    "spaced repetition",
    "programming study",
    "coding concepts",
    "memory techniques",
    "learning tools",
  ],
  openGraph: {
    title: "Flashcards | Course AI",
    description:
      "Create and study with interactive flashcards to reinforce your programming knowledge and improve retention of key concepts.",
    url: "https://courseai.dev/dashboard/flashcard",
    type: "website",
    images: [{ url: "/og-image-flashcards.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flashcards | Course AI",
    description:
      "Create and study with interactive flashcards to reinforce your programming knowledge and improve retention of key concepts.",
    images: ["/twitter-image-flashcards.jpg"],
  },
}

const Page = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  // CreativeWork schema
  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Flashcard Creator",
    description:
      "Create and study with interactive flashcards to reinforce your programming knowledge and improve retention of key concepts.",
    creator: {
      "@type": "Organization",
      name: "Course AI",
    },
    url: `${baseUrl}/dashboard/flashcard`,
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
        name: "Flashcards",
        item: `${baseUrl}/dashboard/flashcard`,
      },
    ],
  }

  return (
    <QuizCreationPage
      type="flashcard"
      title="Flashcard Set"
      metadata={{
        creativeWorkSchema,
        breadcrumbSchema,
      }}
    />
  )
}

export default Page

