import { Suspense } from "react"
import { getAuthSession } from "@/lib/authOptions"
import { QuizzesClient } from "./components/QuizzesClient"
import { getQuizzes } from "@/app/actions/getQuizes"
import { QuizzesSkeleton } from "./components/QuizzesSkeleton"

export const dynamic = "force-dynamic"

const QuizPage = async () => {
  const session = await getAuthSession()
  const userId = session?.user?.id
  const initialQuizzesData = await getQuizzes({ page: 1, limit: 5, searchTerm: "", userId: userId, quizTypes: [] });
  console.log(initialQuizzesData);
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Explore Quizzes</h1>
      <Suspense fallback={<QuizzesSkeleton />}>
        <QuizzesClient initialQuizzesData={initialQuizzesData} userId={userId} />
      </Suspense>
    </div>
  )
}

export default QuizPage

