import { Suspense } from "react"
import { BlankQuizMainContainer } from "../(components)/BlankQuizMainContainer"
import { Skeleton } from "@/components/ui/skeleton"
import AnimatedQuizHighlight from "@/app/components/RanomQuiz"

function QuizSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Skeleton className="w-full h-12 mb-4" />
      <Skeleton className="w-full h-[400px] mb-4" />
    </div>
  )
}

export default async function BlankQuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = (await params)

  return (
    <div className="  py-8  sm:px-6 lg:px-8">
      <div className="p-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            <Suspense fallback={<QuizSkeleton />}>
              <BlankQuizMainContainer slug={slug} />

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
  );
}

