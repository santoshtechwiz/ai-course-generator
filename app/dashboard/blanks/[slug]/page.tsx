import { Suspense } from "react"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { authOptions } from "@/lib/authOptions"
import SlugPageLayout from "@/components/shared/SlugPageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BlankQuizWrapper } from "@/components/features/blanks/BlankQuizWrapper"
import AnimatedQuizHighlight from "@/components/RanomQuiz"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Fetch quiz data for metadata
  const title = `Fill in the Blanks: ${params.slug}`
  const description = `Test your knowledge with this fill in the blanks quiz on ${params.slug}`

  return {
    title,
    description,
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

  return (
    <SlugPageLayout
      title={`Fill in the Blanks: ${params.slug}`}
      description={`Test your knowledge on ${params.slug}`}
      sidebar={<AnimatedQuizHighlight />}
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>{params.slug}</CardTitle>
          </CardHeader>
          <CardContent>
            <BlankQuizWrapper slug={params.slug}  />
          </CardContent>
        </Card>
      </Suspense>
    </SlugPageLayout>
  )
}

