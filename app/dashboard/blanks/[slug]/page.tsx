import { Suspense } from "react"
import { QuizContent } from "../(components)/QuizContent"
import { Skeleton } from "@/components/ui/skeleton"

function QuizSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Skeleton className="w-full h-12 mb-4" />
      <Skeleton className="w-full h-[400px] mb-4" />
    </div>
  )
}

export default async function BlankQuizPage({ params  }: { params: Promise<{ slug: string }> }) {
  const {slug} = (await params)
  return (
    <Suspense fallback={<QuizSkeleton />}>
      <QuizContent slug={slug} />
    </Suspense>
  )
}

