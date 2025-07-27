"use client"

import { use } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import McqQuizWrapper from "../components/McqQuizWrapper"

import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import QuizSEO from "../../components/QuizSEO"
import { getQuizSlug } from "../../components/utils"
import { useSession } from "next-auth/react"


export default function McqQuizPage({
  params,
}: {
  params: Promise<{ slug: string }> 
}) {
  // Unwrap params for future compatibility
  const slug = getQuizSlug(params);
  const userId = useSession()?.data?.user?.id || undefined;

  const router = useRouter()


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
    )
  }
  return (
    <QuizPlayLayout 
      quizSlug={slug} 
      quizType="mcq"
      quizId={slug}
      ownerId={userId || ''}
      isPublic={true}
      userId={userId}
      isFavorite={false}
    >
      <QuizSEO 
        slug={slug}
        quizType="mcq"
        description={`Test your knowledge with this ${slug.replace(/-/g, ' ')} multiple choice quiz. Challenge yourself and learn something new!`}
      />
      <McqQuizWrapper slug={slug} />
    </QuizPlayLayout>
  )
}
