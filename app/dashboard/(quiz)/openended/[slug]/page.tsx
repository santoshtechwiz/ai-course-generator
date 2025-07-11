"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import OpenEndedQuizWrapper from "../components/OpenEndedQuizWrapper"

import QuizPlayLayout from "../../components/layouts/QuizPlayLayout"
import QuizSEO from "../../components/QuizSEO"
import { GlobalLoader } from "@/components/ui/loader"
export default function OpenEndedQuizPage({
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
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <div className="flex flex-col items-center space-y-4">
          <GlobalLoader />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-4">
            Initializing quiz...<br />Loading user session
          </p>
        </div>
      </div>
    )
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
    <QuizPlayLayout 
      quizSlug={slug} 
      quizType="openended"
      quizId={slug}
      isPublic={true} 
      isFavorite={false}
    >
      <QuizSEO 
        slug={slug}
        quizType="openended"
        description={`Challenge yourself with this ${slug.replace(/-/g, ' ')} open-ended quiz. Provide your own answers and test your knowledge!`}
      />
      <OpenEndedQuizWrapper slug={slug} />
    </QuizPlayLayout>
  );
}
