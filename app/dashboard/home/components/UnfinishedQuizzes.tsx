"use client"

import { useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface RecentQuizAttempt {
  quizId: string
  quizSlug: string
  quizTitle: string
  questionCount: number
  questionsAnswered: number
  timeSpent: number
  lastAttempted: string
  isInProgress: boolean
  type: string
}

interface UnfinishedQuizzesProps {
  attempts: RecentQuizAttempt[]
}

function getTimeoutWarning(timeSpent: number, questionCount: number) {
  const avgTimePerQuestion = timeSpent / questionCount
  if (avgTimePerQuestion < 10) { // Less than 10 seconds per question
    return {
      warning: "Take your time! You're moving too fast.",
      color: "text-red-600"
    }
  }
  if (avgTimePerQuestion < 30) { // Less than 30 seconds per question
    return {
      warning: "Consider spending more time on each question.",
      color: "text-orange-600"
    }
  }
  return null
}

export default function UnfinishedQuizzes({ attempts }: UnfinishedQuizzesProps) {
  const inProgressAttempts = useMemo(() => {
    return attempts
      .filter(attempt => attempt.isInProgress || attempt.questionsAnswered < attempt.questionCount)
      .sort((a, b) => new Date(b.lastAttempted).getTime() - new Date(a.lastAttempted).getTime())
  }, [attempts])

  const getQuizTypeColor = useCallback((quizType: string) => {
    switch (quizType.toLowerCase()) {
      case 'mcq': return 'bg-blue-100 text-blue-800'
      case 'openended': return 'bg-purple-100 text-purple-800'
      case 'code': return 'bg-green-100 text-green-800'
      case 'blanks': return 'bg-orange-100 text-orange-800'
      case 'flashcard': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  // If no unfinished quizzes, return null
  if (inProgressAttempts.length === 0) {
    return null
  }

  return (
    <Card className="col-span-full mb-6 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          Continue Your Quizzes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inProgressAttempts.map((attempt, index) => (
            <motion.div
              key={attempt.quizId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    {/* Quiz Title and Type */}
                    <div>
                      <h3 className="font-medium mb-1 line-clamp-2">{attempt.quizTitle}</h3>
                      <Badge variant="secondary" className={getQuizTypeColor(attempt.type)}>
                        {attempt.type.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{Math.round((attempt.questionsAnswered / attempt.questionCount) * 100)}% Complete</span>
                        <span>{attempt.questionsAnswered}/{attempt.questionCount} Questions</span>
                      </div>
                      <Progress 
                        value={(attempt.questionsAnswered / attempt.questionCount) * 100}
                        className="h-2"
                      />
                    </div>

                    {/* Time Warning */}
                    {getTimeoutWarning(attempt.timeSpent, attempt.questionCount) && (
                      <div className={`flex items-center gap-2 text-sm ${getTimeoutWarning(attempt.timeSpent, attempt.questionCount)?.color}`}>
                        <AlertTriangle className="w-4 h-4" />
                        <span>{getTimeoutWarning(attempt.timeSpent, attempt.questionCount)?.warning}</span>
                      </div>
                    )}

                    {/* Time Info and Resume Button */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          {Math.round(attempt.timeSpent / 60)} min spent
                        </span>
                      </div>
                      <Button asChild>
                        <Link href={`/quiz/${attempt.type}/${attempt.quizSlug}`}>
                          Resume Quiz
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}