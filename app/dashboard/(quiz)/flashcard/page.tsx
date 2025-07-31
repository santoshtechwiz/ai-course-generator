import QuizCreationPage from "../components/QuizCreationPage"

export const metadata = {
  title: "Interactive Flashcard Quiz – Free Coding Flashcards | CourseAI",
  description:
    "Create, study, and master programming concepts with interactive flashcard quizzes. Practice coding, reinforce knowledge, and boost retention using AI-powered flashcards.",
  keywords: [
    "interactive flashcard quiz",
    "AI flashcards",
    "coding flashcard practice",
    "free flashcard generator",
    "programming flashcards",
    "spaced repetition",
    "learn to code",
    "memory techniques",
    "study tools",
    "quiz for programmers",
    "developer learning",
    "computer science revision",
    "CourseAI flashcards"
  ],
  openGraph: {
    title: "Interactive Flashcard Quiz | CourseAI",
    description:
      "Create, study, and master programming concepts with interactive flashcard quizzes. Practice coding, reinforce knowledge, and boost retention using AI-powered flashcards.",
    url: "https://courseai.io/dashboard/flashcard",
    type: "website",
    images: [{ url: "/og-image-flashcards.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interactive Flashcard Quiz | CourseAI",
    description:
      "Create, study, and master programming concepts with interactive flashcard quizzes. Practice coding, reinforce knowledge, and boost retention using AI-powered flashcards.",
    images: ["/twitter-image-flashcards.jpg"],
  },
};

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
