import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { BlankQuizWrapper } from "@/components/features/blanks/BlankQuizWrapper"
import AnimatedQuizHighlight from "@/components/RanomQuiz"


function QuizSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="w-full h-12" />
      <Skeleton className="w-full h-[400px]" />
    </div>
  )
}

export default async function BlankQuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <div className="py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<QuizSkeleton />}>
              <BlankQuizWrapper slug={slug} />
            </Suspense>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
              <AnimatedQuizHighlight />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

