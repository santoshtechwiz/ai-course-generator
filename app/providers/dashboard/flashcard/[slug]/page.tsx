import { getAuthSession } from "@/lib/authOptions"
import FlashCardsPageClient from "../components/FlashCardsPageClient"
import type { Metadata } from "next"
import RandomQuiz from "@/components/RanomQuiz"
import SlugPageLayout from "@/components/SlugPageLayout"

interface FlashCardsPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Extract a readable title from the slug
  const readableTitle = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return {
    title: `${readableTitle} Flashcards | Programming Study`,
    description: `Memorize key programming concepts with these ${readableTitle.toLowerCase()} flashcards. Perfect for mastering coding terminology and syntax.`,
    keywords: [
      "coding flashcards",
      "programming memory aids",
      `${params.slug.replace(/-/g, " ")} study cards`,
      "coding concept cards",
      "programming terminology practice",
    ],
  }
}

export default async function FlashCardsPage({ params }: FlashCardsPageProps) {
  const userId = (await getAuthSession())?.user.id ?? ""

  return (
    <SlugPageLayout sidebar={<RandomQuiz />}>
      <FlashCardsPageClient slug={(await params).slug} userId={userId} />
    </SlugPageLayout>
  )
}

