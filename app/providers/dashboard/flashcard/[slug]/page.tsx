import { getAuthSession } from "@/lib/authOptions"
import FlashCardsPageClient from "../components/FlashCardsPageClient"

import AnimatedQuizHighlight from "@/components/RanomQuiz"
import SlugPageLayout from "@/components/SlugPageLayout"

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

