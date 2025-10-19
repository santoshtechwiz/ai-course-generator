import React from 'react'
import { useSmartRecommendations } from '@/hooks/useRecommendations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, BookOpen, Brain, AlertCircle } from 'lucide-react'
import { UnifiedLoader } from '@/components/loaders'

interface Recommendation {
  id: string
  type: 'course' | 'quiz'
  title: string
  description: string
  confidence: number
  reasoning: string
  url: string
}

export function RecommendationsWidget() {
  const {
    recommendations,
    count,
    message,
    error,
    isLoading,
    refetch,
    invalidateCache,
    isInvalidating
  } = useSmartRecommendations()

  const handleRefresh = () => {
    refetch()
  }

  const handleInvalidate = () => {
    invalidateCache()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UnifiedLoader
            state="loading"
            variant="spinner"
            size="md"
            message="Analyzing your learning patterns..."
            className="py-8"
          />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Recommendations</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'Something went wrong while fetching your recommendations.'}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
            {count > 0 && (
              <Badge variant="secondary">{count}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleInvalidate}
              variant="outline"
              size="sm"
              disabled={isInvalidating}
            >
              Clear Cache
            </Button>
          </div>
        </div>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
            <p className="text-muted-foreground">
              Complete some courses or quizzes to get personalized AI recommendations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec: Recommendation) => (
              <div
                key={rec.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={rec.type === 'course' ? 'default' : 'secondary'}>
                      {rec.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(rec.confidence * 100)}% match
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold mb-1">{rec.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {rec.description}
                </p>
                <div className="text-xs text-muted-foreground mb-3">
                  <strong>AI Reasoning:</strong> {rec.reasoning}
                </div>
                <Button asChild size="sm">
                  <a href={rec.url}>
                    {rec.type === 'course' ? 'Start Course' : 'Take Quiz'}
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
