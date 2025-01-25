import type { UserQuiz } from "@/app/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function getQuizTypeRoute(quizType: string): string {
  switch (quizType) {
    case "mcq":
      return "mcq"
    case "openended":
      return "openended"
    case "fill-blanks":
      return "blanks"
    default:
      return "quiz"
  }
}

export default function QuizHistory({ quizzes }: { quizzes: UserQuiz[] }) {
  const recentQuizzes = quizzes.slice(0, 5)

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>Recent Quizzes</CardTitle>
      </CardHeader>
      <CardContent>
        {recentQuizzes.length > 0 ? (
          <ul className="space-y-2">
            {recentQuizzes.map((quiz, index) => (
              <li key={index} className="flex justify-between items-center">
                <Link
                  href={`/dashboard/${getQuizTypeRoute(quiz.quizType)}/${quiz.slug}`}
                  className="truncate hover:underline"
                >
                  {quiz.topic}
                </Link>
                <span className="font-semibold">{quiz.bestScore}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No quizzes taken yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

