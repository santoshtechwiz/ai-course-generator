"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PageLoader from "@/components/ui/loader"

interface Quiz {
  id: string
  title: string
  score: number
  totalQuestions: number
  date: string
}

export default function ProfileQuizzes() {
  const {
    data: quizzes,
    isLoading,
    error,
  } = useQuery<Quiz[]>({
    queryKey: ["userQuizzes"],
    queryFn: async () => {
      const response = await axios.get("/api/user/quizzes")
      return response.data
    },
  })

  if (isLoading) return <div><PageLoader></PageLoader></div>
  if (error) return <div>Error loading quizzes</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Quizzes</CardTitle>
        <CardDescription>Review your recent quiz performances</CardDescription>
      </CardHeader>
      <CardContent>
        {quizzes && quizzes.length > 0 ? (
          <ul className="space-y-4">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{quiz.title}</h4>
                  <p className="text-sm text-muted-foreground">{quiz.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {quiz.score}/{quiz.totalQuestions}
                  </Badge>
                  <Badge variant={quiz.score / quiz.totalQuestions >= 0.7 ? "success" : "destructive"}>
                    {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>You haven't taken any quizzes yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

