"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import BlanksQuizWrapper from "../components/BlanksQuizWrapper"
import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import QuizSEO from "../../components/QuizSEO"


export default function BlanksQuizPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  // Unwrap params for future compatibility
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const { status: authStatus } = useSession()
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
      quizType="blanks"
      quizId={slug}
      isPublic={true} 
      isFavorite={false}
    >
      <QuizSEO 
        slug={slug}
        quizType="blanks"
        description={`Improve your knowledge with this ${slug.replace(/-/g, ' ')} fill-in-the-blanks exercise. Complete the missing words and enhance your understanding!`}
      />
      <BlanksQuizWrapper
      slug={slug}
      title="Fill in the Blanks Quiz"
      />
    </QuizPlayLayout>
  )
}
