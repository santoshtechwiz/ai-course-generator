"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuizState"
import { toast } from "react-hot-toast"

import { Card, CardContent } from "@/components/ui/card"
import NonAuthenticatedUserSignInPrompt from "../../../components/NonAuthenticatedUserSignInPrompt"
import { InitializingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"
import CodeQuizResult from "../../components/CodeQuizResult"
import { QuizSubmissionLoading } from "../../../components"
import type { QuizResult } from "@/app/types/quiz-types"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

interface ProcessedResult extends QuizResult {
  questions: Array<{
    id: string
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    codeSnippet?: string
  }>
}

export default function CodeResultsPage({ params }: ResultsPageProps) {
  // Extract slug in a way that works in tests and in real usage
  const slug =
    params instanceof Promise
      ? use(params).slug // Real usage with Next.js
      : (params as { slug: string }).slug // Test usage

  const router = useRouter()
  const { isAuthenticated, status, requireAuth } = useAuth()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fetchAttempted, setFetchAttempted] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [resultData, setResultData] = useState<QuizResult | null>(null)

  // Get quiz using the hook API
  const { quiz, results, tempResults, status: quizStatus, actions } = useQuiz()

  // Log for debugging
  useEffect(() => {
    console.log("Results page mounted with:", {
      tempResults,
      results,
      quizStatus,
      slug,
    })
  }, [tempResults, results, quizStatus, slug])

  // Authentication and results loading
  useEffect(() => {
    // Skip if we're still loading auth status
    if (status === "loading") return

    let isMounted = true

    // If authenticated and no results are loaded yet, try to fetch them
    if (isAuthenticated && !fetchAttempted) {
      console.log("Code Page: Auth status ready, loading results for:", slug)
      setFetchAttempted(true)

      // Skip API call if we already have temporary results from just completing the quiz
      if (!results && !tempResults) {
        console.log("Code Page: No results found, fetching from API")

        // Call getResults with the correct slug and 'code' type
        if (actions?.getResults) {
          console.log("Code Page: Calling getResults with:", slug)
          actions
            .getResults(slug, "code")
            .then((data) => {
              console.log("Code Page: Results fetched successfully:", data)
            })
            .catch((error) => {
              if (isMounted) {
                console.error("Code Page: Error loading results:", error)
                setLoadError(error?.message || "Failed to load quiz results")
              }
            })
        } else {
          console.error("Code Page: getResults action not available")
          setLoadError("Results loading function not available")
        }
      } else {
        console.log("Code Page: Results already available:", results || tempResults)
      }
    }

    return () => {
      isMounted = false
    }
  }, [slug, isAuthenticated, actions, results, tempResults, status, fetchAttempted])

  // Function to save temporary results to database
  const handleSaveResults = async () => {
    if (!tempResults || !actions?.saveResults) {
      console.error("Cannot save results: missing temporary results or saveResults function")
      return
    }

    try {
      console.log("Saving results to database:", tempResults)
      setIsSaving(true)
      // Only show one toast at a time
      toast.loading("Saving your results...")

      // Ensure required fields are present for saving
      const dataToSave = {
        ...tempResults,
        maxScore: tempResults.maxScore || tempResults.totalQuestions || tempResults.questions?.length || 0,
        score: tempResults.score || tempResults.correctAnswers || 0,
      }

      await actions.saveResults(slug, dataToSave)
      console.log("Results saved successfully")
      toast.dismiss()
      toast.success("Results saved successfully!")
      setSaveSuccess(true)

      // Refresh results after saving to get the officially saved version
      if (actions.getResults) {
        try {
          await actions.getResults(slug)
        } catch (err) {
          console.error("Error refreshing results:", err)
          // Don't show error for this since it's not critical
        }
      }
    } catch (error) {
      console.error("Failed to save results:", error)
      toast.dismiss()
      toast.error("Failed to save your results")
      setLoadError("Failed to save your results")
    } finally {
      setIsSaving(false)
    }
  }

  // Process results data
  useEffect(() => {
    const initialResultData: QuizResult | null = results || tempResults

    if (initialResultData) {
      console.log("About to render results page with data:", {
        rawData: initialResultData,
        hasResultArray: Array.isArray(initialResultData.result),
        score: initialResultData.score,
        maxScore: initialResultData.maxScore,
        questionsLength: initialResultData.questions?.length || 0,
      })

      // Check if we have a nested result array (API response format)
      if (Array.isArray(initialResultData.result) && initialResultData.result.length > 0) {
        console.log("Found nested result array, extracting first item")

        // Extract the first result from the array and use its data
        const firstResult = initialResultData.result[0]

        // Create a properly formatted result object
        const processedData = {
          quizId: String(firstResult.quizId || ""),
          slug: firstResult.slug || firstResult.quizSlug || slug,
          title: firstResult.quizTitle || "Quiz",
          score: typeof firstResult.score === "number" ? firstResult.score : 0,
          maxScore: firstResult.questions?.length || 0,
          percentage: typeof firstResult.accuracy === "number" ? firstResult.accuracy : 0,
          completedAt: firstResult.attemptedAt || initialResultData.completedAt || new Date().toISOString(),
          questions: Array.isArray(firstResult.questions)
            ? firstResult.questions.map((q) => ({
                id: String(q.questionId || ""),
                question: q.question || "",
                userAnswer: q.userAnswer || "",
                correctAnswer: q.correctAnswer || "",
                isCorrect: !!q.isCorrect,
                codeSnippet: q.codeSnippet || "",
              }))
            : [],
        } as ProcessedResult

        console.log("Normalized result data:", processedData)
        setResultData(processedData)
      } else {
        setResultData(initialResultData)
      }
    }
  }, [results, tempResults, slug])

  // First check auth to maintain correct test behavior
  if (!isAuthenticated && status !== "loading") {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="code"
        onSignIn={() => requireAuth(`/dashboard/code/${slug}/results`)}
        showSaveMessage={false}
        message="Please sign in to view your quiz results"
      />
    )
  }

  // Keep loading after auth check for test compatibility
  if ((quizStatus?.isLoading || status === "loading") && !results && !tempResults) {
    return <InitializingDisplay />
  }

  // Error state
  if (loadError || quizStatus?.errorMessage) {
    return (
      <ErrorDisplay
        error={loadError || quizStatus?.errorMessage || "Failed to load results"}
        onRetry={() => {
          setFetchAttempted(false)
          setLoadError(null)
        }}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  // No results found - only after checking authentication and loading
  if (!results && !tempResults && isAuthenticated && fetchAttempted) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p>We couldn't find your results for this quiz.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push(`/dashboard/code/${slug}`)}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
          >
            Take the Quiz
          </button>
        </div>
      </div>
    )
  }

  return resultData ? (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <CodeQuizResult result={resultData as QuizResult} />

          {/* Show save button if these are temporary results */}
          {!results && tempResults && isAuthenticated && !saveSuccess && (
            <div className="mt-6 text-center">
              <button
                onClick={handleSaveResults}
                disabled={isSaving}
                className={`bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded ${
                  isSaving ? "opacity-70 cursor-not-allowed" : ""
                }`}
                data-testid="save-results-button"
              >
                {isSaving ? "Saving..." : "Save Results to Your Account"}
              </button>
              <p className="text-sm mt-2 text-gray-600">Save your results to view them again later</p>
            </div>
          )}

          {/* Show success message if results were saved */}
          {saveSuccess && (
            <div className="mt-6 text-center p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700">Your results have been saved to your account</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  ) : (
    <InitializingDisplay message="Preparing your quiz results..." />
  )
}
