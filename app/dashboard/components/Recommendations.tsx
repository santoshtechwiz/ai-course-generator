'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ArrowRight, Target, RotateCcw, BookOpen } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import ChapterModal from './ChapterModal'

interface CourseProgress {
  id: number;
  userId: string;
  courseId: number;
  currentChapterId: number;
  currentUnitId: number | null;
  completedChapters: string;
  progress: number;
  lastAccessedAt: Date;
  timeSpent: number;
  isCompleted: boolean;
  quizScores: string | null;
  notes: string | null;
  bookmarks: string | null;
  course: {
    id: number;
    name: string;
    slug: string | null;
  };
}

interface QuizAttempt {
  id: number;
  userId: string;
  quizId: number;
  score: number;
  timeSpent: number;
  createdAt: Date;
  quiz: {
    chapterId: number;
  };
}

interface AIRecommendationsProps {
  courseProgress: CourseProgress[];
  quizAttempts: QuizAttempt[];
}

export default function AIRecommendations({ courseProgress, quizAttempts }: AIRecommendationsProps) {
  const [selectedRecommendation, setSelectedRecommendation] = useState<any | null>(null)

  const generateRecommendations = (): any[] => {
    const recommendations: any[] = []

    // Find courses with low progress
    const lowProgressCourses = courseProgress.filter(c => c.progress < 30 && !c.isCompleted)
    if (lowProgressCourses.length > 0 && lowProgressCourses[0].course.slug) {
      recommendations.push({
        type: 'next',
        message: `Continue ${lowProgressCourses[0].course.name} to maintain your learning momentum`,
        courseId: lowProgressCourses[0].courseId,
        slug: lowProgressCourses[0].course.slug
      })
    }

    // Find quizzes with low scores
    const lowScoreQuizzes = quizAttempts.filter(q => q.score < 70)
    if (lowScoreQuizzes.length > 0) {
      const latestLowScoreQuiz = lowScoreQuizzes.reduce((latest, current) => 
        latest.createdAt > current.createdAt ? latest : current
      )
      const relevantCourseProgress = courseProgress.find(c => c.currentChapterId === latestLowScoreQuiz.quiz.chapterId)
      if (relevantCourseProgress) {
        recommendations.push({
          type: 'review',
          message: 'Review previous chapters to improve your quiz scores',
          courseId: relevantCourseProgress.courseId,
          chapterId: latestLowScoreQuiz.quiz.chapterId
        })
      }
    }

    // Recommend practice if no recent activity
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const inactiveCourses = courseProgress.filter(c => new Date(c.lastAccessedAt) < oneWeekAgo && !c.isCompleted)
    if (inactiveCourses.length > 0 && inactiveCourses[0].course.slug) {
      recommendations.push({
        type: 'practice',
        message: 'Practice makes perfect! Take a quick quiz to stay sharp',
        courseId: inactiveCourses[0].courseId,
        slug: inactiveCourses[0].course.slug
      })
    }

    return recommendations
  }

  const recommendations = generateRecommendations()

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No recommendations at the moment</p>
          <p className="text-xs text-muted-foreground">Keep learning and check back later!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                {rec.type === 'review' && (
                  <RotateCcw className="h-5 w-5 text-yellow-500 shrink-0" />
                )}
                {rec.type === 'practice' && (
                  <Target className="h-5 w-5 text-blue-500 shrink-0" />
                )}
                {rec.type === 'next' && (
                  <ArrowRight className="h-5 w-5 text-green-500 shrink-0" />
                )}
                <div className="flex-1 space-y-2">
                  <p className="text-sm">{rec.message}</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => setSelectedRecommendation(rec)}
                  >
                    Get Started →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      {selectedRecommendation && (
        <ChapterModal
          recommendation={selectedRecommendation}
          onClose={() => setSelectedRecommendation(null)}
        />
      )}
    </Card>
  )
}

