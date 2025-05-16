"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuiz } from "@/hooks/useQuizState"
import { InitializingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"
import CodeQuizResult from "../../components/CodeQuizResult"
import { QuizSubmissionLoading } from "../../../components/QuizSubmissionLoading"
import { useToast } from "@/components/ui/use-toast"

export default function CodeQuizResultsPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug as string
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  
  const { 
    results, 
    quizData, 
    userAnswers,
    isLoading: stateLoading, 
    submissionError,
    getResults 
  } = useQuiz()

  useEffect(() => {
    async function fetchResults() {
      if (!slug) {
        setError("Quiz ID not found")
        setIsLoading(false)
        return
      }

      try {
        // Show loading for at least 1 second for better UX
        const minLoadingPromise = new Promise(resolve => setTimeout(resolve, 1000))
        
        // If we have existing results, use them
        if (results && results.questions && results.questions.length > 0) {
          console.log("Using existing results:", results)
          await minLoadingPromise
          setIsLoading(false)
          return
        }
        
        // Otherwise try to fetch results
        console.log("Fetching results for slug:", slug)
        try {
          const fetchedResults = await getResults(slug)
          console.log("Fetched results:", fetchedResults)
          await minLoadingPromise
          setIsLoading(false)
        } catch (err) {
          console.error("Failed to fetch results, attempting to show local results")
          
          // If we have quizData and userAnswers, we can show local results
          if (quizData && userAnswers.length > 0) {
            toast({
              title: "Could not retrieve saved results",
              description: "Showing your answers locally instead.",
              variant: "warning",
            })
            
            // Create local results structure
            const localResult = {
              quizId: quizData.id,
              slug: quizData.slug,
              title: quizData.title,
              score: userAnswers.length,
              total: quizData.questions?.length || userAnswers.length,
              maxScore: quizData.questions?.length || userAnswers.length,
              percentage: Math.round((userAnswers.length / quizData.questions.length) * 100),
              completedAt: new Date().toISOString(),
              questions: quizData.questions.map(q => {
                const userAns = userAnswers.find(a => a.questionId === q.id);
                return {
                  id: q.id,
                  question: q.question,
                  userAnswer: typeof userAns?.answer === 'string' ? userAns.answer : JSON.stringify(userAns?.answer) || "",
                  correctAnswer: q.correctAnswer || q.answer || "",
                  isCorrect: true // We don't know, so assume correct for display purposes
                };
              })
            };
            
            // Wait for minimum loading time
            await minLoadingPromise
            setIsLoading(false)
          } else {
            throw err; // Re-throw if we can't create local results
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch or create quiz results:", err)
        setError(err?.message || "Failed to load quiz results. Please try again.")
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [slug, getResults, results, quizData, userAnswers, toast])

  const handleRetry = useCallback(() => {
    setIsLoading(true)
    setError(null)
    // Reload the page to retry fetching results
    window.location.reload()
  }, [])

  const handleReturn = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  if (isLoading || stateLoading) {
    return <QuizSubmissionLoading quizType="code" />
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} onReturn={handleReturn} />
  }

  // If we have results from the Redux store or we created local results
  if (results) {
    return <CodeQuizResult result={results} />
  }

  // Fallback if somehow we get here without results or error
  return (
    <ErrorDisplay 
      error="Something went wrong while loading your results. Please try again."
      onRetry={handleRetry} 
      onReturn={handleReturn}
    />
  )
}
