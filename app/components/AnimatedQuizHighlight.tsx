"use client"

import React from "react"
import { motion } from "framer-motion"
import { CheckCircle2, FileQuestion, AlignJustify, HelpCircle, ChevronRight, Zap, Trophy } from 'lucide-react'
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const iconMap = {
  mcq: CheckCircle2,
  "openended": FileQuestion,
  "fill-blanks": AlignJustify,
}

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

const difficultyColors = {
  Easy: "bg-green-500/10 text-green-600 border-green-200",
  Medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  Hard: "bg-red-500/10 text-red-600 border-red-200"
}

export const AnimatedQuizHighlight: React.FC = () => {
  const { quizzes, isLoading, error } = useRandomQuizzes(3)

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Random Quizzes</h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-[140px] w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <CardTitle className="flex items-center mb-4">
          <Zap className="h-5 w-5 text-primary mr-2" />
          Random Quizzes
        </CardTitle>
        <p className="text-destructive">Error: {error}</p>
      </div>
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Random Quizzes</h2>
        </div>
        <Badge variant="outline" className="text-xs">
          Updated Daily
        </Badge>
      </div>

      <div className="space-y-4">
        {quizzes.map((quiz, index) => (
          <Link href={`/${getQuizTypeRoute({ quizType: quiz.quizType })}/${quiz.slug}`} key={quiz.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 15 }}
                      className={`rounded-lg p-3 ${
                        quiz.quizType === "mcq"
                          ? "bg-green-500/10"
                          : quiz.quizType === "openended"
                            ? "bg-red-500/10"
                            : "bg-yellow-500/10"
                      }`}
                    >
                      {React.createElement(iconMap[quiz.quizType as keyof typeof iconMap] || HelpCircle, {
                        className: `h-6 w-6 ${
                          quiz.quizType === "mcq"
                            ? "text-green-500"
                            : quiz.quizType === "openended"
                              ? "text-red-500"
                              : "text-yellow-500"
                        }`,
                      })}
                    </motion.div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {quiz.topic}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {quiz.quizType.replace("-", " ")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${difficultyColors[getQuizDifficulty(quiz.quizType) as keyof typeof difficultyColors]}`}
                      >
                        {getQuizDifficulty(quiz.quizType)}
                      </Badge>
                      {quiz.bestScore && (
                        <div className="flex items-center text-xs font-medium text-muted-foreground">
                          <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                          Best: {quiz.bestScore}%
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>

      <Button 
        className="w-full group" 
        variant="outline"
        asChild
      >
        <Link href="/dashboard/quizzes">
          Explore More Quizzes
          <motion.div
            className="ml-2"
            initial={{ x: 0 }}
            whileHover={{ x: 5 }}
          >
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        </Link>
      </Button>
    </div>
  )
}
