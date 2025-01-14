'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ArrowRight, Target, RotateCcw } from 'lucide-react'

import Link from "next/link"


interface AIRecommendationsProps {
  courseProgress: any[]
  quizScores: any[]
}

export default function AIRecommendations({ courseProgress, quizScores }: AIRecommendationsProps) {
  // Generate personalized recommendations based on user data
  const generateRecommendations = (): any[] => {
    const recommendations: any[] = []

    // Find courses with low progress
    const lowProgressCourses = courseProgress?.filter(c => c.progress < 30)
    if (lowProgressCourses.length > 0) {
      recommendations.push({
        type: 'next',
        message: `Continue ${lowProgressCourses[0].course.name} to maintain your learning momentum`,
        courseId: lowProgressCourses[0].course.id
      })
    }

    // Find quizzes with low scores
    const lowScoreQuizzes = quizScores?.filter(q => q.score < 70)
    if (lowScoreQuizzes && lowScoreQuizzes.length > 0) {
      recommendations.push({
        type: 'review',
        message: 'Review previous chapters to improve your quiz scores',
        courseId: lowScoreQuizzes[0].courseId,
        chapterId: lowScoreQuizzes[0].chapterId
      })
    }

    // Recommend practice if no recent activity
    if (courseProgress.length>0 && courseProgress?.every(c => c.lastActivity < Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      recommendations.push({
        type: 'practice',
        message: 'Practice makes perfect! Take a quick quiz to stay sharp',
        courseId:  courseProgress[0].course.id 
      })
    }

    return recommendations
  }

  const recommendations = generateRecommendations()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              {rec.type === 'review' && (
                <RotateCcw className="h-5 w-5 text-yellow-500" />
              )}
              {rec.type === 'practice' && (
                <Target className="h-5 w-5 text-blue-500" />
              )}
              {rec.type === 'next' && (
                <ArrowRight className="h-5 w-5 text-green-500" />
              )}
              <div className="flex-1">
                <p className="text-sm">{rec.message}</p>
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0 text-xs"
                  asChild
                >
                  <Link href={`/course/${rec.slug}${rec.chapterId ? `/chapter/${rec.chapterId}` : ''}`}>
                    Get Started →
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

