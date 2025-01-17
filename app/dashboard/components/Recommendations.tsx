'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ArrowRight, Target, RotateCcw, BookOpen } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { FullCourseType, FullChapterType } from "@/app/types"

interface CourseProgress {
  id: number;
  userId: string;
  courseId: number;
  currentChapterId: number;
  currentUnitId: number | null;
  completedChapters: number[];
  progress: number;
  lastAccessedAt: Date;
  timeSpent: number;
  isCompleted: boolean;
  quizScores: Record<string, number> | null;
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
}

interface AIRecommendationsProps {
  courses: FullCourseType[];
  courseProgress: CourseProgress[];
  quizAttempts: QuizAttempt[];
}

export default function AIRecommendations({ courses, courseProgress, quizAttempts }: AIRecommendationsProps) {
  const router = useRouter()

  const generateRecommendations = (): any[] => {
    const recommendations: any[] = []

    // Find courses with low progress
    const lowProgressCourses = courseProgress.filter(c => c.progress < 30 && !c.isCompleted)
    if (lowProgressCourses.length > 0) {
      const course = courses.find(c => c.id === lowProgressCourses[0].courseId)
      if (course && course.courseUnits.length > 0 && course.courseUnits[0].chapters.length > 0) {
        recommendations.push({
          type: 'next',
          message: `Continue ${course.name} to maintain your learning momentum`,
          courseId: course.id,
          chapterId: course.courseUnits[0].chapters[0].id,
          slug: course.slug
        })
      }
    }

    // Find quizzes with low scores
    const lowScoreQuizzes = quizAttempts.filter(q => q.score < 70)
    if (lowScoreQuizzes.length > 0) {
      const latestLowScoreQuiz = lowScoreQuizzes.reduce((latest, current) => 
        latest.createdAt > current.createdAt ? latest : current
      )
      const relevantCourse = courses.find(c => 
        c.courseUnits.some(unit => 
          unit.chapters.some(chapter => 
            chapter.questions.some(question => question.id === latestLowScoreQuiz.quizId)
          )
        )
      )
      if (relevantCourse) {
        const relevantChapter = relevantCourse.courseUnits
          .flatMap(unit => unit.chapters)
          .find(chapter => chapter.questions.some(question => question.id === latestLowScoreQuiz.quizId))
        if (relevantChapter) {
          recommendations.push({
            type: 'review',
            message: 'Review previous chapters to improve your quiz scores',
            courseId: relevantCourse.id,
            chapterId: relevantChapter.id,
            slug: relevantCourse.slug
          })
        }
      }
    }

    // Recommend practice if no recent activity
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const inactiveCourses = courseProgress.filter(c => new Date(c.lastAccessedAt) < oneWeekAgo && !c.isCompleted)
    if (inactiveCourses.length > 0) {
      const course = courses.find(c => c.id === inactiveCourses[0].courseId)
      if (course && course.courseUnits.length > 0 && course.courseUnits[0].chapters.length > 0) {
        recommendations.push({
          type: 'practice',
          message: 'Practice makes perfect! Take a quick quiz to stay sharp',
          courseId: course.id,
          chapterId: course.courseUnits[0].chapters[0].id,
          slug: course.slug
        })
      }
    }

    return recommendations
  }

  const recommendations = generateRecommendations()

  const handleRecommendationClick = (recommendation: any) => {
    router.push(`/dashboard/course/${recommendation.slug}?chapter=${recommendation.chapterId}`)
  }

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
                    onClick={() => handleRecommendationClick(rec)}
                  >
                    Get Started →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

