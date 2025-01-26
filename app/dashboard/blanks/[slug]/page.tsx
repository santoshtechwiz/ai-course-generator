import { Suspense } from "react"
import { QuizContent } from "../components/QuizContent"


export default function BlankQuizPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div>Loading quiz...</div>}>
      <QuizContent slug={params.slug} />
    </Suspense>
  )
}

