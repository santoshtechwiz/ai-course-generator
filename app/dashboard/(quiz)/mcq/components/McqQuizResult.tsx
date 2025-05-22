"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, RefreshCw, Home } from "lucide-react"
import { QuizResult } from "@/app/types/quiz-types"
import { toast } from "sonner"

interface McqQuizResultProps {
  result: QuizResult;
}

interface NormalizedResult {
  slug: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  questions: Array<{
    id: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;

}

export default function McqQuizResult({ result }: McqQuizResultProps) {
  const router = useRouter()
  
  // Extract any nested result array (handling the specific API response format)
  const processedResult = useMemo((): QuizResult => {
    // Handle the case where result contains a 'result' array (API format)
    if (result?.result && Array.isArray(result.result) && result.result.length > 0) {
      const firstResult = result.result[0];
      return {
        quizId: String(firstResult.quizId || ''),
        slug: firstResult.slug || firstResult.quizSlug || "",
        title: firstResult.quizTitle || "Quiz",
        score: typeof firstResult.score === 'number' ? firstResult.score : 0,
        maxScore: firstResult.questions?.length || 0,
        percentage: typeof firstResult.accuracy === 'number' ? firstResult.accuracy : 0,
        completedAt: firstResult.attemptedAt || new Date().toISOString(),
        questions: Array.isArray(firstResult.questions) 
          ? firstResult.questions.map(q => ({
              id: String(q.questionId || ''),
              question: q.question || '',
              userAnswer: q.userAnswer || "",
              correctAnswer: q.correctAnswer || "",
              isCorrect: !!q.isCorrect
            })) 
          : []
      };
    }
    return result;
  }, [result]);
  
  // Log the processed result for debugging
  useEffect(() => {
    if (process.env.NODE_ENV !== 'test') {
      console.log("McqQuizResult processed data:", processedResult);
    }
  }, [processedResult]);

  // Verify and normalize the result data to ensure all required fields are present
  const normalizedResult: NormalizedResult = {
    slug: processedResult?.slug || "",
    title: processedResult?.title || "MCQ Quiz",
    score: typeof processedResult?.score === 'number' ? processedResult.score : 0,
    maxScore: typeof processedResult?.maxScore === 'number' ? processedResult.maxScore : 
              (Array.isArray(processedResult?.questions) ? processedResult.questions.length : 13),
    percentage: typeof processedResult?.percentage === 'number' ? processedResult.percentage : 
                (processedResult?.maxScore > 0 
                  ? Math.round((processedResult.score / processedResult.maxScore) * 100) 
                  : 0),
    completedAt: processedResult?.completedAt || new Date().toISOString(),
    questions: Array.isArray(processedResult?.questions) 
      ? processedResult.questions.map(q => ({
          id: q?.id || String(q?.questionId) || String(Math.random()).slice(2),
          question: q?.question || "Unknown question",
          userAnswer: q?.userAnswer || "",
          correctAnswer: q?.correctAnswer || "",
          isCorrect: Boolean(q?.isCorrect)
        })) 
      : []
  }

  // Clean up the slug to remove any query parameters
  const cleanSlug = normalizedResult.slug.split('?')[0];

  // Debug the normalized result
  useEffect(() => {
    console.log("Normalized result data:", normalizedResult)
  }, [normalizedResult])

  // Calculate score percentage safely
  const scorePercentage = normalizedResult.maxScore > 0 
    ? Math.round((normalizedResult.score / normalizedResult.maxScore) * 100) 
    : 0

  // Check if we have valid question data
  const hasValidQuestions = normalizedResult.questions.length > 0

  // Update UI to show when there are issues with the data
  if (!hasValidQuestions) {
    return (
      <Card className="max-w-3xl mx-auto p-6 shadow-md border-t-4 border-t-primary" data-testid="mcq-quiz-result">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-md">
            <h2 className="font-semibold">Data Issue Detected</h2>
            <p>There appears to be a problem with your quiz results data.</p>
            <pre className="text-xs mt-4 p-3 bg-gray-50 overflow-auto max-h-40 rounded text-gray-700">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
          
          {/* Action buttons still available */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 mt-6 border-t">
            <Button
              onClick={() => router.push(`/dashboard/mcq/${normalizedResult.slug}`)}
              className="flex items-center gap-2 bg-primary"
            >
              <RefreshCw className="w-4 w-4" />
              <span>Retry Quiz</span>
            </Button>
            <Button
              onClick={() => router.push("/dashboard/quizzes")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 w-4" />
              <span>Return to Dashboard</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleRetryQuiz = useCallback(() => {
    toast.loading("Loading quiz...");
    // Fix: Make sure to use mcq path, not code path
    const navSlug = cleanSlug || normalizedResult.slug.split('?')[0];
    router.push(`/dashboard/mcq/${navSlug}?reset=true`); // Add reset=true to ensure quiz is reset
  }, [cleanSlug, normalizedResult.slug, router]);

  const handleReturnToDashboard = useCallback(() => {
    router.push("/dashboard/quizzes");
  }, [router]);

  return (
    <Card className="max-w-3xl mx-auto p-6 shadow-md border-t-4 border-t-primary" data-testid="mcq-quiz-result">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Quiz Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score summary */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div>
            <h2 className="text-xl font-semibold">{normalizedResult.title}</h2>
            <p className="text-muted-foreground">
              {normalizedResult.completedAt && 
                new Date(normalizedResult.completedAt).toLocaleDateString(undefined, {
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-center">
            <div className={`text-3xl font-bold ${scorePercentage >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
              {normalizedResult.score} / {normalizedResult.maxScore}
            </div>
            <div className={`text-sm font-medium ${scorePercentage >= 70 ? 'text-green-600' : 'text-amber-600'}`} data-testid="score-percentage">
              {scorePercentage}% Score
            </div>
          </div>
        </div>

        {/* Question details */}
        <div className="space-y-4 mt-6">
          <h3 className="text-xl font-semibold mb-4">Your Answers</h3>
          {normalizedResult.questions.map((q, i) => (
            <div key={q.id || i} className="mb-4 p-4 border rounded-md bg-background shadow-sm" data-testid={`question-result-${i}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-1 rounded-full ${q.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                  {q.isCorrect ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Q{i + 1}: {q.question}</p>
                  <div className="text-sm mt-2 space-y-1">
                    <p className="text-muted-foreground">
                      Your answer: <span className={q.isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {q.userAnswer || 'No answer provided'}
                      </span>
                    </p>
                    {!q.isCorrect && (
                      <p className="text-green-700 font-medium">
                        Correct answer: {q.correctAnswer || 'Unknown'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons - use the cleaned slug */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 mt-6 border-t">
          <Button
            onClick={handleRetryQuiz}
            className="flex items-center gap-2 bg-primary"
            data-testid="retry-quiz-button"
          >
            <RefreshCw className="w-4 w-4" />
            <span>Retry Quiz</span>
          </Button>
          <Button
            onClick={handleReturnToDashboard}
            variant="outline"
            className="flex items-center gap-2"
            data-testid="return-dashboard-button"
          >
            <Home className="w-4 w-4" />
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
