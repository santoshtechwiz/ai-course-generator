"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { Trophy, CheckCircle2, XCircle, BookOpen, Star } from "lucide-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface OrderingStep {
  id: number
  description: string
  explanation?: string
}

interface QuestionResult {
  questionId: number
  title: string
  description: string
  steps: OrderingStep[]
  userAnswer: number[] // indices of ordered steps
  correctAnswer: number[] // indices of correct order
  isCorrect: boolean
  timeSpent: number
}

interface OrderingQuizResultsProps {
  result: {
    questionResults: QuestionResult[]
    score: number
    percentage: number
    totalQuestions: number
    totalTime: number
    completedAt: string
  }
  slug: string
  onRetake: () => void
}

export default function OrderingQuizResults({ result, slug, onRetake }: OrderingQuizResultsProps) {
  const metrics = useMemo(() => {
    const correctAnswers = result.questionResults?.filter(q => q.isCorrect).length || 0
    const totalQuestions = result.totalQuestions || result.questionResults?.length || 0
    const percentage = result.percentage || (totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0)

    let performanceLevel: 'excellent' | 'good' | 'average' | 'needs-improvement'
    if (percentage >= 90) performanceLevel = 'excellent'
    else if (percentage >= 75) performanceLevel = 'good'
    else if (percentage >= 60) performanceLevel = 'average'
    else performanceLevel = 'needs-improvement'

    return {
      percentage: Math.round(percentage),
      correctAnswers,
      totalQuestions,
      performanceLevel,
      timeSpent: result.totalTime
    }
  }, [result])

  const performanceConfig = {
    excellent: {
      icon: Trophy,
      message: 'Outstanding! Perfect understanding of sequencing.',
      color: 'bg-green-500'
    },
    good: {
      icon: CheckCircle2,
      message: 'Great work! Good grasp of the process flows.',
      color: 'bg-blue-500'
    },
    average: {
      icon: Star,
      message: 'Good effort. Review the failed questions to improve.',
      color: 'bg-yellow-500'
    },
    'needs-improvement': {
      icon: BookOpen,
      message: 'Keep practicing! Work through each step carefully.',
      color: 'bg-red-500'
    }
  }

  const config = performanceConfig[metrics.performanceLevel]
  const IconComponent = config.icon

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Card className="relative overflow-hidden border-4 border-border shadow-[6px_6px_0px_0px_hsl(var(--border))] rounded-none">
          <CardHeader className="relative z-10 text-center py-8 bg-background">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 rounded-sm bg-main text-main-foreground border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))]">
                <IconComponent className="w-8 h-8" />
              </div>
            </div>

            <div>
              <CardTitle className="text-3xl md:text-4xl font-bold mb-2">Quiz Results</CardTitle>
              <p className="text-sm text-muted-foreground">
                Completed on {new Date(result.completedAt).toLocaleString()}
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Metrics Row */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card className="p-4 border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] rounded-sm bg-background">
            <div className="text-sm text-muted-foreground font-bold">Score</div>
            <div className="text-3xl font-black text-primary mt-2">{metrics.percentage}%</div>
          </Card>
          <Card className="p-4 border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] rounded-sm bg-background">
            <div className="text-sm text-muted-foreground font-bold">Correct</div>
            <div className="text-3xl font-black text-green-600 mt-2">
              {metrics.correctAnswers}/{metrics.totalQuestions}
            </div>
          </Card>
          <Card className="p-4 border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] rounded-sm bg-background">
            <div className="text-sm text-muted-foreground font-bold">Status</div>
            <div className="text-lg font-bold mt-2">
              {metrics.percentage >= 60 ? (
                <span className="text-green-600">✓ Passed</span>
              ) : (
                <span className="text-red-600">✗ Failed</span>
              )}
            </div>
          </Card>
          <Card className="p-4 border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] rounded-sm bg-background">
            <div className="text-sm text-muted-foreground font-bold">Time Spent</div>
            <div className="text-lg font-bold mt-2">
              {Math.floor(metrics.timeSpent / 60)}m {Math.floor(metrics.timeSpent % 60)}s
            </div>
          </Card>
        </div>

        {/* Performance Message */}
        <Card className="mt-6 p-4 bg-background border-l-4 border-primary border-3 border-b-0 border-t-0 border-r-0 shadow-[4px_4px_0px_0px_hsl(var(--border))] rounded-sm">
          <p className="text-sm font-bold text-foreground">{config.message}</p>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 flex flex-col sm:flex-row gap-3 justify-end"
      >
        <Button variant="reverse" onClick={() => window.history.back()} className="font-black border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] active:shadow-[2px_2px_0px_0px_hsl(var(--border))] active:translate-y-1 transition-all duration-150">
          Back
        </Button>
        <Button onClick={onRetake} className="font-black border-3 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:shadow-[6px_6px_0px_0px_hsl(var(--border))] active:shadow-[2px_2px_0px_0px_hsl(var(--border))] active:translate-y-1 transition-all duration-150">
          Retake Quiz
        </Button>
      </motion.div>
    </div>
  )
}
