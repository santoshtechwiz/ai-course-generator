"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Brain, RefreshCw, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useSmartRecommendations } from "@/hooks/useRecommendations"
import { EnhancedErrorBoundary } from "@/components/error-boundary"
import { Loader } from "@/components/loader"

interface Recommendation {
  type: "course" | "quiz"
  id: string
  title: string
  slug: string
  description?: string
  category?: string
  quizType?: string
  reason: string
  confidence: number
  aiReasoning?: string
}

function RecommendationsWidget() {
  const {
    recommendations,
    count,
    isLoading,
    error,
    invalidateCache,
    isInvalidating
  } = useSmartRecommendations()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended for You</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader message="Generating personalized recommendations..." />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Unable to load recommendations</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Recommended for You</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => invalidateCache()}
          disabled={isInvalidating}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isInvalidating ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recommendations available yet</p>
            <p className="text-sm">Complete some courses or quizzes to get personalized recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec: Recommendation) => (
              <RecommendationItem key={rec.id} recommendation={rec} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecommendationItem({ recommendation }: { recommendation: Recommendation }) {
  const { type, title, slug, description, category, quizType, reason, confidence, aiReasoning } = recommendation

  const buildQuizSlug = (quizType: string) => {
    switch (quizType) {
      case "mcq":
        return "mcq"
      case "openended":
        return "openended"
      case "blanks":
        return "blanks"
      case "code":
        return "code"
      case "flashcard":
        return "flashcard"
      default:
        return "quiz"
    }
  }

  const linkHref = type === "course"
    ? `/dashboard/course/${slug}`
    : `/dashboard/${buildQuizSlug(category || quizType || "quiz")}/${slug}`

  const confidenceColor = confidence >= 0.8 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                         confidence >= 0.6 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                         "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border hover:shadow-md transition-all duration-200 bg-gradient-to-r from-card/50 to-card/80">
      <div className="flex-shrink-0 mt-1">
        {type === "course" ? (
          <BookOpen className="h-5 w-5 text-blue-500" />
        ) : (
          <Brain className="h-5 w-5 text-purple-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <Link href={linkHref} className="hover:underline">
              <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </h4>
            </Link>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className={`text-xs ${confidenceColor} border-0`}>
              {Math.round(confidence * 100)}% match
            </Badge>
            <Badge variant="outline" className="text-xs">
              {type === "course" ? "Course" : "Quiz"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          {category && (
            <Badge variant="outline" className="text-xs bg-primary/5">
              {category}
            </Badge>
          )}
          {quizType && (
            <Badge variant="outline" className="text-xs bg-secondary/5">
              {quizType}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Why recommended:</span> {reason}
          </p>
          {aiReasoning && aiReasoning !== reason && (
            <p className="text-xs text-primary/70 italic">
              🤖 {aiReasoning}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function RecommendationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
              <Skeleton className="h-5 w-5 mt-1" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Wrapped component with error boundary for better error handling
function RecommendationsWidgetWithErrorBoundary() {
  return (
    <EnhancedErrorBoundary
      fallback={
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Unable to load recommendations</p>
              <p className="text-sm">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <RecommendationsWidget />
    </EnhancedErrorBoundary>
  )
}

export default RecommendationsWidgetWithErrorBoundary
