"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, ExternalLink, XCircle } from "lucide-react"
import { cn } from "@/lib/tailwindUtils"
import type { QuizType } from "@/app/types/quiz-types"

interface Quiz {
  id: string
  title: string
  slug: string
  score?: number
  completedAt?: string
  status: "completed" | "failed" | "in-progress"
  type?: QuizType
}

interface QuizHistoryProps {
  quizzes: Quiz[]
}

export default function QuizHistory({ quizzes }: QuizHistoryProps) {
  const [expanded, setExpanded] = useState(false)

  // Sort quizzes by completion date (most recent first)
  const sortedQuizzes = [...(quizzes || [])].sort((a, b) => {
    if (!a.completedAt) return 1
    if (!b.completedAt) return -1
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  })

  // Limit to 5 quizzes unless expanded
  const displayQuizzes = expanded ? sortedQuizzes : sortedQuizzes.slice(0, 3)

  if (!quizzes || quizzes.length === 0) {
    return (
      <Card className="hover-card-effect">
        <CardHeader>
          <CardTitle>Quiz History</CardTitle>
          <CardDescription>You haven't taken any quizzes yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-6">
            <Link href="/dashboard/quizzes">
              <Button className="button-hover-effect">Explore Quizzes</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  }

  return (
    <Card className="hover-card-effect">
      <CardHeader>
        <CardTitle>Quiz History</CardTitle>
        <CardDescription>Your recent quiz performance</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {displayQuizzes.map((quiz) => (
            <motion.div key={quiz.id} variants={item}>
              <Link href={`/dashboard/quiz/${quiz.slug}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                        quiz.status === "completed"
                          ? "bg-success/10"
                          : quiz.status === "failed"
                            ? "bg-destructive/10"
                            : "bg-muted",
                      )}
                    >
                      {quiz.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : quiz.status === "failed" ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium line-clamp-1">{quiz.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {quiz.type && (
                          <Badge variant="outline" className="text-xs">
                            {quiz.type}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{formatDate(quiz.completedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {quiz.score !== undefined && (
                      <div
                        className={cn("text-sm font-medium", quiz.score >= 70 ? "text-success" : "text-destructive")}
                      >
                        {quiz.score}%
                      </div>
                    )}
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {sortedQuizzes.length > 3 && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              {expanded ? "Show Less" : `Show ${sortedQuizzes.length - 3} More`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
