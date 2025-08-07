import { generateQuizMetadata } from "@/lib/quiz-metadata"
import type { Metadata } from "next"
import QuizCreationPage from "../components/QuizCreationPage"

// Generate dynamic SEO metadata for flashcard page
export const metadata: Metadata = generateQuizMetadata({
  quizType: "flashcard",
  title: "Interactive Flashcard Quiz Creator",
  description: "Create, study, and master programming concepts with interactive flashcard quizzes. Practice coding, reinforce knowledge, and boost retention using AI-powered flashcards.",
  topic: "Programming",
  difficulty: "medium"
});

const Page = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

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
