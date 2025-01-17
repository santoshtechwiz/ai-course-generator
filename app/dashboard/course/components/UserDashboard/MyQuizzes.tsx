import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { BrainCircuit } from 'lucide-react'

interface QuizType {
  id: number
  topic: string
  score: number | null
  gameType: string
  slug: string
}

interface MyQuizzesProps {
  quizzes: QuizType[]
}

export function MyQuizzes({ quizzes }: MyQuizzesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Quizzes</CardTitle>
      </CardHeader>
      <CardContent>
        {quizzes.length > 0 ? (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <Link 
                href={`/dashboard/${quiz.gameType === 'open-ended' ? 'openended' : 'mcq'}/${quiz.slug}`} 
                key={quiz.id} 
                className="block"
              >
                <div className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors">
                  <div>
                    <p className="font-medium">{quiz.topic}</p>
                    <p className="text-sm text-muted-foreground">
                      Score: {quiz.score !== null ? `${quiz.score}%` : 'N/A'}
                    </p>
                  </div>
                  <Badge>{quiz.gameType}</Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No quizzes created yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start creating your first quiz.</p>
            <div className="mt-6">
              <Link href="/dashboard/quiz" passHref>
                <Button>Create a Quiz</Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

