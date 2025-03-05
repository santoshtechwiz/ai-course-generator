import { Suspense } from "react"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { authOptions } from "@/lib/authOptions"
import SlugPageLayout from "@/components/SlugPageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BlankQuizWrapper } from "@/components/features/blanks/BlankQuizWrapper"
import AnimatedQuizHighlight from "@/components/RanomQuiz"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Extract a readable title from the slug
  const readableTitle = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  const title = `Fill in the Blanks: ${readableTitle}`
  const description = `Practice your coding knowledge with this fill-in-the-blanks exercise on ${readableTitle.toLowerCase()}. Enhance your programming syntax skills.`

  return {
    title: `${title} | Programming Practice`,
    description,
    keywords: [
      "coding fill-in-blanks",
      "programming syntax practice",
      "code completion exercise",
      `${params.slug.replace(/-/g, " ")} practice`,
      "developer skills training",
    ],
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  )
}

export default async function BlankQuizPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || ""

  // Extract a readable title from the slug
  const readableTitle = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <SlugPageLayout
      title={`Fill in the Blanks: ${readableTitle}`}
      description={`Test your coding knowledge on ${readableTitle}`}
      sidebar={<AnimatedQuizHighlight />}
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>{readableTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <BlankQuizWrapper slug={params.slug} />
          </CardContent>
        </Card>
      </Suspense>
    </SlugPageLayout>
  )
}

