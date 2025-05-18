import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Loader } from "@/components/ui/loader"
import FlashCardsPageClient from "../components/FlashCardsPageClient"
import { ResolvingMetadata, Metadata } from "next"

// Generate metadata for SEO
export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Use basic metadata without fetching data to avoid complexity
  return {
    title: `Flashcards Study | AI Learning Platform`,
    description: `Study and review flashcards to enhance your learning`,
  }
}

// Fix: Export this as default with correct params type
export default async function Page({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || ""
  
  // Check if slug exists
  if (!params.slug) {
    return notFound()
  }
  
  return (
    <div className="container py-6">
      <Suspense fallback={<Loader />}>
        <FlashCardsPageClient slug={params.slug} userId={userId} />
      </Suspense>
    </div>
  )
}
