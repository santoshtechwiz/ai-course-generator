import { QuizWrapper } from "@/components/QuizWrapper"
import RandomQuote from "@/components/RandomQuote"
import { BookOpen, Lightbulb } from "lucide-react"
import RandomQuiz from "@/components/RanomQuiz"

export const metadata = {
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
    url: "https://courseai.dev/dashboard/blanks",
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

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
    <div className="container mx-auto py-6 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <RandomQuote />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center text-foreground">
                <BookOpen className="mr-2 h-6 w-6 text-primary" />
                Create a New Quiz
              </h2>
              <div className="hidden sm:flex items-center text-sm text-muted-foreground bg-secondary/10 px-3 py-1.5 rounded-full">
                <Lightbulb className="h-4 w-4 mr-1.5 text-yellow-500" />
                Pro tip: Be specific with your topic
              </div>
            </div>
            <QuizWrapper type="fill-in-the-blanks" />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-border/50">
            <RandomQuiz />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page

