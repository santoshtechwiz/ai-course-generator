"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, FileQuestion, AlignJustify, HelpCircle, ChevronRight, Zap, Trophy } from "lucide-react"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const iconMap = {
  mcq: CheckCircle2,
  openended: FileQuestion,
  "fill-blanks": AlignJustify,
}

const quizTypeRoutes = {
  mcq: "dashboard/mcq",
  openended: "dashboard/openended",
  "fill-blanks": "dashboard/blanks",
}

const difficultyConfig = {
  Easy: { color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle2 },
  Medium: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: HelpCircle },
  Hard: { color: "bg-red-500/10 text-red-600 border-red-200", icon: FileQuestion },
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

const QuizCard: React.FC<{ quiz: any; index: number }> = React.memo(({ quiz, index }) => {
  const difficulty = getQuizDifficulty(quiz.quizType)
  const { color } = difficultyConfig[difficulty as keyof typeof difficultyConfig]
  const Icon = iconMap[quiz.quizType as keyof typeof iconMap] || HelpCircle

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      layout
      className="w-full"
    >
      <Link href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes] || "dashboard/quiz"}/${quiz.slug}`}>
        <Card className="transition-all hover:shadow-md hover:bg-accent/50 h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className={`${color} text-xs`}>
                {difficulty}
              </Badge>
              {quiz.bestScore && (
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                  Best: {quiz.bestScore}%
                </div>
              )}
            </div>
            <div className="flex items-start gap-3 flex-grow">
              <div className={`rounded-lg p-2 ${color} flex-shrink-0`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="text-sm sm:text-base font-semibold truncate">{quiz.topic}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground capitalize">{quiz.quizType.replace("-", " ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
})

QuizCard.displayName = "QuizCard"

export const AnimatedQuizHighlight: React.FC = () => {
  const { quizzes, isLoading, error } = useRandomQuizzes(3)

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Zap className="h-5 w-5 text-primary" />
            Random Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-[120px] w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Zap className="h-5 w-5 text-primary" />
            Random Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Zap className="h-5 w-5 text-primary" />
            Random Quizzes
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Updated Daily
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {quizzes.map((quiz, index) => (
              <QuizCard key={quiz.id} quiz={quiz} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full group" variant="outline" asChild>
          <Link href="/dashboard/quizzes" className="flex items-center justify-center">
            <span>Explore More Quizzes</span>
            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

