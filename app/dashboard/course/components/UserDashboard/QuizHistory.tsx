import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuizHistoryProps {
  quizzes: any[]
}

export default function QuizHistory({ quizzes }: QuizHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Quizzes</CardTitle>
      </CardHeader>
      <CardContent>
        {quizzes.length > 0 ? (
          <ul className="space-y-2">
            {quizzes.slice(0, 5).map(quiz => (
              <li key={quiz.id} className="flex justify-between text-sm">
                <span>{quiz.topic}</span>
                <span>{new Date(quiz.timeStarted).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent quizzes</p>
        )}
      </CardContent>
    </Card>
  )
}

