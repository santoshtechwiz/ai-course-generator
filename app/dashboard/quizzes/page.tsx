import { Suspense } from "react"
import { ExploreClient } from "./components/ExploreClient"
import { getQuizzes } from "@/lib/db"


export const dynamic = "force-dynamic"

export default async function QuizPage() {
  const initialQuizzes = await getQuizzes()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Explore Quizzes</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ExploreClient initialQuizzes={initialQuizzes} />
      </Suspense>
    </div>
  )
}

