"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GraduationCap, RefreshCw, Target, Clock, Award } from "lucide-react"
import Link from "next/link"
import { useSmartRecommendations } from "@/hooks/useRecommendations"
import { EnhancedErrorBoundary } from "@/components/error-boundary"
import { getSafeQuizHref } from '@/utils/navigation'

interface QuizRecommendation {
  id: string
  type: 'quiz'
  title: string
  slug: string
  description?: string
  category?: string
  difficulty?: string
  estimatedTime?: number
  confidence: number
  reasoning: string
  aiExplanation?: string
  metadata: {
    contentType: string
    tags: string[]
    prerequisites?: string[]
    learningObjectives?: string[]
  }
}

function QuizRecommendationsContent() {
  const {
    recommendations,
    count,
    isLoading,
    error,
    invalidateCache,
    isInvalidating
  } = useSmartRecommendations()

  // Filter only quiz recommendations
  const quizRecommendations = recommendations.filter((rec: any) => rec.type === 'quiz').slice(0, 3)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Recommended Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Unable to load quiz recommendations</p>
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
          <Target className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Recommended Quizzes</CardTitle>
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
        {quizRecommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No quiz recommendations available yet</p>
            <p className="text-sm">Complete some quizzes to get personalized recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizRecommendations.map((rec: QuizRecommendation) => (
              <div key={rec.id} className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-2">{rec.title}</h4>
                      {rec.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {rec.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {rec.difficulty && (
                          <Badge variant="secondary" className="text-xs">
                            {rec.difficulty}
                          </Badge>
                        )}
                        {rec.estimatedTime && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {rec.estimatedTime}min
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Award className="h-3 w-3" />
                          {Math.round(rec.confidence * 100)}% match
                        </div>
                      </div>
                    </div>
                      <Button asChild size="sm" className="ml-4">
                      <Link href={getSafeQuizHref('quiz', rec.slug)}>
                        Take Quiz
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Wrapped component with error boundary
function QuizRecommendationsWidget() {
  return (
    <EnhancedErrorBoundary
      fallback={
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Unable to load quiz recommendations</p>
              <p className="text-sm">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <QuizRecommendationsContent />
    </EnhancedErrorBoundary>
  )
}

export default QuizRecommendationsWidget