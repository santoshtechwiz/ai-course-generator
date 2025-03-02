import { getAuthSession } from "@/lib/authOptions"
import FlashCardsPageClient from "../components/FlashCardsPageClient"


interface FlashCardsPageProps {
  params: Promise<{ slug: string }>
}

export default async function FlashCardsPage({ params }: FlashCardsPageProps) {
  const userId = (await getAuthSession())?.user.id ?? "";
  return <FlashCardsPageClient slug={(await params).slug} 
    userId={userId}
  
  />
}

