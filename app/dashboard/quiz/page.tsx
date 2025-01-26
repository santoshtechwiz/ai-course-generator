import { getPublicQuizzes } from "@/lib/db"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/authOptions"
import RandomQuiz from "../mcq/components/RandomQuiz"
import { AnimatedQuizHighlight } from "@/app/components/AnimatedQuizHighlight"
import { QuizWrapper } from "@/components/QuizWrapper"

const Page = async () => {
  const session = await getAuthSession()
  const isLoggedIn = !!session?.user

  const publicQuizzes = await getPublicQuizzes()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Create & Play Quizzes</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Create a New Quiz</h2>
          <QuizWrapper type="mcq" />
        </div>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Random Quiz</h2>
          </div>
          <div className="p-4">
            <AnimatedQuizHighlight />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page

export const metadata: Metadata = {
  title: "Create & Play Quizzes",
  description: "A platform to create and play quizzes.",
}

