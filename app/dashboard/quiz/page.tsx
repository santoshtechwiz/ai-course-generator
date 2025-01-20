import { getPublicQuizzes } from "@/lib/db"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/authOptions"
import RandomQuiz from "../mcq/components/RandomQuiz"
import CreateQuizForm from "./components/CreateQuizForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const Page = async () => {
  const session = await getAuthSession()
  const isLoggedIn = !!session?.user

  const publicQuizzes = await getPublicQuizzes()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Create & Play Quizzes</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Create a New Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateQuizForm isLoggedIn={isLoggedIn} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Random Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <RandomQuiz games={publicQuizzes} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Page

export const metadata: Metadata = {
  title: "Create & Play Quizzes",
  description: "A platform to create and play quizzes.",
}

