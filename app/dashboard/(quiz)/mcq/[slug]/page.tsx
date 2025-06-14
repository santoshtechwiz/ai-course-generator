"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import McqQuizWrapper from "../components/McqQuizWrapper"
import { QuizLoader } from "@/components/ui/quiz-loader"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import QuizSEO from "../../components/QuizSEO"


export default function McqQuizPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  // Unwrap params for future compatibility
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const { status: authStatus } = useSession()
  const router = useRouter()

  // Check for loading state
  if (authStatus === "loading") {
    return <QuizLoader full message="Initializing quiz..." subMessage="Loading user session" />
  }

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
    <QuizPlayLayout quizSlug={slug} quizType="mcq">
      <QuizSEO 
        slug={slug}
        quizType="mcq"
        description={`Test your knowledge with this ${slug.replace(/-/g, ' ')} multiple choice quiz. Challenge yourself and learn something new!`}
      />
      <McqQuizWrapper slug={slug} />
    </QuizPlayLayout>
  )
}
