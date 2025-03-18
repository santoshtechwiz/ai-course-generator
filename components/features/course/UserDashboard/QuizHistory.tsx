"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { UserQuiz } from "@/app/types/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

function getQuizTypeRoute(quizType: string): string {
  switch (quizType) {
    case "mcq":
      return "mcq"
    case "openended":
      return "openended"
    case "fill-blanks":
      return "blanks"
    case "code":
      return "code"
    case "flashcard":
      return "flashcard"
    default:
      return "quiz"
  }
}

export default function QuizHistory({ quizzes }: { quizzes: UserQuiz[] }) {
  const [showAll, setShowAll] = useState(false)
  const displayQuizzes = showAll ? quizzes : quizzes.slice(0, 5)

  const getScoreColor = (score: number | undefined) => {
    if (!score) return "text-muted-foreground"
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-amber-500"
    return "text-red-500"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="overflow-hidden border-border">
        <CardHeader className="border-b bg-card px-4 py-3">
          <CardTitle className="text-base font-medium">Recent Quizzes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {displayQuizzes.length > 0 ? (
            <div className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {displayQuizzes.map((quiz, index) => (
                  <motion.div
                    key={quiz.slug}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b last:border-0 border-border"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                      </div>

                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium text-sm text-foreground break-words">{quiz.title}</h3>
                        <Badge variant="secondary" className="mt-1 text-xs font-normal">
                          {quiz.quizType.charAt(0).toUpperCase() + quiz.quizType.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 ml-auto">
                        <div className="text-right">
                          <span className={cn("text-base font-semibold", getScoreColor(quiz.bestScore))}>
                            {quiz.bestScore !== undefined ? `${quiz.bestScore}%` : "0%"}
                          </span>
                          <p className="text-xs text-muted-foreground">Best Score</p>
                        </div>

                        <Button asChild size="sm" variant="secondary" className="rounded-full px-2 py-1 h-7">
                          <Link href={`/dashboard/${getQuizTypeRoute(quiz.quizType)}/${quiz.slug}`}>
                            <span>View</span>
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8 px-4"
            >
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-center mb-1">No quizzes taken yet</h3>
              <p className="text-xs text-muted-foreground text-center max-w-sm mb-4">
                Start your learning journey by taking your first quiz.
              </p>
              <Button asChild size="sm">
                <Link href="/dashboard/quizzes">
                  <BookOpen className="mr-2 h-3 w-3" />
                  Browse Quizzes
                </Link>
              </Button>
            </motion.div>
          )}
        </CardContent>
        {quizzes.length > 5 && (
          <div className="p-3 bg-muted/50 border-t border-border">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show Less" : `Show All (${quizzes.length})`}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  )
}