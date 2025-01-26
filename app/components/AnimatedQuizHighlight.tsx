"use client"

import React from "react"
import { motion } from "framer-motion"
import { CheckCircle2, FileQuestion, AlignJustify, HelpCircle, ChevronRight } from "lucide-react"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

function getQuizTypeRoute({ quizType }: { quizType: string }): string {
  switch (quizType) {
    case "mcq":
      return "dashboard/mcq"
    case "openended":
      return "dashboard/openended"
    case "fill-blanks":
      return "dashboard/blanks"
    default:
      return "dashboard/quiz"
  }
}

const iconMap = {
  mcq: CheckCircle2,
  "openended": FileQuestion,
  "fill-blanks": AlignJustify,
}


export const AnimatedQuizHighlight: React.FC = () => {
  const { quizzes, isLoading, error } = useRandomQuizzes(3)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Featured Quizzes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Featured Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  const getQuizDifficulty = (quizType: string) => {
    switch (quizType) {
      case "mcq":
        return "Easy"
      case "openended":
      case "fill-blanks":
        return "Hard"
      default:
        return "Medium"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Quizzes</CardTitle>
        <CardDescription>Explore our latest and most popular quizzes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {quizzes.map((quiz, index) => (
          <Link href={`/${getQuizTypeRoute({ quizType: quiz.quizType })}/${quiz.slug}`} key={quiz.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="flex items-center space-x-4 p-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`rounded-full p-3 ${
                      quiz.quizType === "mcq"
                        ? "bg-green-500"
                        : quiz.quizType === "openended"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                    }`}
                  >
                    {React.createElement(iconMap[quiz.quizType as keyof typeof iconMap] || HelpCircle, {
                      className: "h-6 w-6 text-white",
                    })}
                  </motion.div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold">{quiz.topic}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{quiz.quizType.replace("-", " ")}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant="secondary">{getQuizDifficulty(quiz.quizType)}</Badge>
                    {quiz.bestScore && <span className="text-sm font-semibold">Best: {quiz.bestScore}%</span>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href="/dashboard/quizzes">
            Explore More Quizzes
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

