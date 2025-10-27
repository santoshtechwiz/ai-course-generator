"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import CodeQuizWrapper from "../components/CodeQuizWrapper"

import { QuizPlayInterface } from "@/components/dashboard/QuizPlayInterface"
import { useSelector } from "react-redux"

interface CodeQuizClientProps {
  slug: string
}

export default function CodeQuizClient({ slug }: CodeQuizClientProps) {
  const router = useRouter();
  
  // Get quiz state from Redux for layout purposes
  const quizData = useSelector((state: any) => state.quiz);

  // Let the wrapper component handle data fetching to avoid duplicates

  if (!slug) {
    return (
      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">Quiz slug is missing. Please check the URL.</p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <QuizPlayInterface
      quizSlug={slug}
      quizType="code"
      quizId={slug}
      isPublic={true}
      isFavorite={false}
      quizData={quizData || null}
    >
      <CodeQuizWrapper slug={slug} />
    </QuizPlayInterface>
  );
}
