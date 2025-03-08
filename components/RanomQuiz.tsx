"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, FileQuestion, AlignJustify, HelpCircle, ChevronRight, Trophy, Sparkles } from "lucide-react"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

const iconMap = {
  mcq: CheckCircle2,
  openended: FileQuestion,
  "fill-blanks": AlignJustify,
  code: Sparkles,
}

const quizTypeRoutes = {
  mcq: "dashboard/mcq",
  openended: "dashboard/openended",
  code: "dashboard/code",
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

const RandomQuizCard: React.FC<{ quiz: any; index: number }> = React.memo(({ quiz, index }) => {
  const difficulty = getQuizDifficulty(quiz.quizType)
  const { color } = difficultyConfig[difficulty as keyof typeof difficultyConfig]
  const Icon = iconMap[quiz.quizType as keyof typeof iconMap] || HelpCircle

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      layout
      className="group"
    >
      <Link href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes] || "dashboard/quiz"}/${quiz.slug}`}>
        <Card className="transition-all duration-300 hover:shadow-md hover:bg-accent/50 overflow-hidden border border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${color} flex-shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-medium line-clamp-1">{quiz.title}</h3>
                  <Badge variant="outline" className={`${color} text-xs px-1.5 py-0 h-5`}>
                    {difficulty}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground capitalize mb-2">{quiz.quizType.replace("-", " ")}</p>

                <div className="mt-2">
                  <Progress value={quiz.completionRate || 0} className="h-1" />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{quiz.completionRate || 0}% completion</p>
                    {quiz.bestScore && (
                      <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                        {quiz.bestScore}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
})

RandomQuizCard.displayName = "RandomQuizCard"

export const RandomQuiz: React.FC = () => {
  const { quizzes, isLoading, error } = useRandomQuizzes(3)

  if (isLoading) {
    return (
      <Card className="w-full border border-primary/20 overflow-hidden">
        <CardHeader className="bg-primary/10 pb-4">
          <CardTitle className="text-lg">Discover Quizzes</CardTitle>
          <CardDescription>Loading recommended quizzes...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-[90px] w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full border border-primary/20 overflow-hidden">
        <CardHeader className="bg-primary/10 pb-4">
          <CardTitle className="text-lg">Discover Quizzes</CardTitle>
          <CardDescription>Recommended quizzes for you</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-destructive text-sm">Unable to load quizzes. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border border-primary/20 overflow-hidden">
      <CardHeader className="bg-primary/10 pb-4">
        <CardTitle className="text-lg">Discover Quizzes</CardTitle>
        <CardDescription>Recommended quizzes for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <AnimatePresence>
          {quizzes.map((quiz, index) => (
            <RandomQuizCard key={quiz.id} quiz={quiz} index={index} />
          ))}
        </AnimatePresence>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 border-t border-border/50">
        <Button className="w-full" variant="outline" asChild>
          <Link href="/dashboard/quizzes" className="flex items-center justify-center">
            <span>Explore More Quizzes</span>
            <motion.div
              className="ml-2"
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default RandomQuiz

