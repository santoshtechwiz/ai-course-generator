"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { UserQuiz } from "@/app/types/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, Trophy } from "lucide-react"

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
    default:
      return "quiz"
  }
}

export default function QuizHistory({ quizzes }: { quizzes: UserQuiz[] }) {
  const [showAll, setShowAll] = useState(false)
  const displayQuizzes = showAll ? quizzes : quizzes.slice(0, 5)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Recent Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {displayQuizzes.length > 0 ? (
            <ul className="divide-y">
              <AnimatePresence>
                {displayQuizzes.map((quiz, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={`/dashboard/${getQuizTypeRoute(quiz.quizType)}/${quiz.slug}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{quiz.topic}</p>
                          <p className="text-sm text-muted-foreground">
                            {quiz.quizType.charAt(0).toUpperCase() + quiz.quizType.slice(1)} Quiz
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold">{quiz.bestScore}%</p>
                          <p className="text-sm text-muted-foreground">Best Score</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                    </Link>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No quizzes taken yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Start a quiz to see your history here.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/quizzes">Take a Quiz</Link>
              </Button>
            </div>
          )}
        </CardContent>
        {quizzes.length > 5 && (
          <div className="p-4 bg-muted/50 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show Less" : "Show All"}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

