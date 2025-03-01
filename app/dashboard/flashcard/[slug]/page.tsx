import FlashCardsPageClient from "../components/FlashCardsPageClient"


interface FlashCardsPageProps {
  params: Promise<{ slug: string }>
}

export default async function FlashCardsPage({ params }: FlashCardsPageProps) {
  return <FlashCardsPageClient slug={(await params).slug} />
}

