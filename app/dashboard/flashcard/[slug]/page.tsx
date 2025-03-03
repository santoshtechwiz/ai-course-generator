import { getAuthSession } from "@/lib/authOptions"
import FlashCardsPageClient from "../components/FlashCardsPageClient"
import SlugPageLayout from "@/components/shared/SlugPageLayout"
import AnimatedQuizHighlight from "@/components/RanomQuiz"

interface FlashCardsPageProps {
  params: Promise<{ slug: string }>
}

export default async function FlashCardsPage({ params }: FlashCardsPageProps) {
  const userId = (await getAuthSession())?.user.id ?? ""

  return (
   <SlugPageLayout sidebar={<AnimatedQuizHighlight />}>
      <FlashCardsPageClient slug={(await params).slug} userId={userId} />
    </SlugPageLayout>
  )
}

