'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

interface RandomQuestion {
  topic: string
  slug: string
}

interface RandomQuestionsProps {
  questions: RandomQuestion[]
}

export default function RandomQuestions({ questions }: RandomQuestionsProps) {
  console.log(questions)
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Random Open-Ended Quizzes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-auto max-h-[calc(100vh-200px)]">
        {questions.map((question) => (
          <Link href={`/openended/${question.slug}`} key={question.slug}>
            <div className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
              <p className="text-sm mb-2 font-medium">{question.topic}</p>
              <Link href={`/dashboard/openended/${question.slug}`} 
                className="text-sm text-primary underline hover:text-primary/80">
                Start Quiz
              </Link>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

