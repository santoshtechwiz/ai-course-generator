"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QuizResult from "../../../components/QuizResult"
import GenericQuizResultHandler from "../../../components/QuizResultHandler"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }  
}

export default function CodeResultsPage({ params }: ResultsPageProps) {
  const router = useRouter()
  
  // Extract slug from params
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const slugString = resolvedParams.slug;
  
  // Handle retake quiz
  const handleRetakeQuiz = () => {
    router.replace(`/dashboard/code/${slugString}`)
  }

  // Handle errors from the generic handler
  const handleError = (error: string) => {
    console.error('Quiz result error:', error);
    // You can add additional error handling here if needed
  }

  // Handle redirects from the generic handler
  const handleRedirect = (path: string) => {
    console.log('Redirecting to:', path);
    // You can add additional redirect handling here if needed
  }

  // If slug is missing, show error
  if (!slugString) {
    return (
      <div className="container max-w-4xl py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-muted-foreground mb-6">Quiz slug is missing. Please check the URL.</p>
            <Button onClick={() => router.replace("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <GenericQuizResultHandler 
        slug={slugString}  
        quizType="code"
        onError={handleError}
        onRedirect={handleRedirect}
      >
        {({ result }) => (
          <QuizResult 
            result={result} 
            slug={slugString} 
            quizType="code" 
            onRetake={handleRetakeQuiz}
          />
        )}
      </GenericQuizResultHandler>
    </div>
  )
}

