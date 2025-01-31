"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, FileQuestion, AlignJustify, HelpCircle, ChevronRight, Zap, Trophy, Sparkles } from "lucide-react"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

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

const RandomQuizCard: React.FC<{ quiz: any; index: number }> = React.memo(({ quiz, index }) => {
  const difficulty = getQuizDifficulty(quiz.quizType)
  const { color } = difficultyConfig[difficulty as keyof typeof difficultyConfig]
  const Icon = iconMap[quiz.quizType as keyof typeof iconMap] || HelpCircle

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      layout
      className="group"
    >
      <Link href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes] || "dashboard/quiz"}/${quiz.slug}`}>
        <Card className="transition-all duration-300 hover:shadow-lg hover:bg-accent/50 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`${color} transition-all duration-300 group-hover:scale-105`}>
                {difficulty}
              </Badge>
              {quiz.bestScore && (
                <motion.div
                  className="flex items-center text-xs font-medium text-muted-foreground"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                  Best: {quiz.bestScore}%
                </motion.div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-start gap-4">
              <motion.div
                className={`rounded-lg p-2 ${color}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <div className="flex-grow min-w-0">
                <CardTitle className="text-base font-semibold truncate">{quiz.topic}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">{quiz.quizType.replace("-", " ")}</p>
              </div>
            </div>
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Progress value={quiz.completionRate || 0} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">{quiz.completionRate || 0}% completion rate</p>
            </motion.div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
})

RandomQuizCard.displayName = "RandomQuizCard"

export const RanomQuiz: React.FC = () => {
  const { quizzes, isLoading, error } = useRandomQuizzes(3)

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Random Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <CardTitle className="flex items-center gap-2">
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
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Random Quizzes
          </CardTitle>
         
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <AnimatePresence>
          {quizzes.map((quiz, index) => (
            <RandomQuizCard key={quiz.id} quiz={quiz} index={index} />
          ))}
        </AnimatePresence>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4">
        <Button className="w-full group" variant="outline" asChild>
          <Link href="/dashboard/quizzes" className="flex items-center justify-center">
            <span>Explore More Quizzes</span>
            <motion.div
              className="ml-2"
              whileHover={{ x: 5 }}
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

export default RanomQuiz

