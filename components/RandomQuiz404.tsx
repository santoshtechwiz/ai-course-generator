"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  FileQuestion,
  AlignJustify,
  HelpCircle,
  ChevronRight,
  Trophy,
  Sparkles,
  Star,
  Zap,
  Clock,
  TrendingUp,
  RotateCcw,
} from "lucide-react"
import { useRandomQuizzes } from "@/hooks/useRandomQuizzes"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/tailwindUtils"

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
  Easy: {
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400",
    icon: CheckCircle2,
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  Medium: {
    color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400",
    icon: HelpCircle,
    badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  },
  Hard: {
    color: "bg-rose-500/10 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400",
    icon: FileQuestion,
    badge: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
  },
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

const getQuizStatus = (quiz: any) => {
  if (quiz.isNew)
    return { label: "New", icon: Zap, className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" }
  if (quiz.isTrending)
    return {
      label: "Trending",
      icon: TrendingUp,
      className: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    }
  if (quiz.isPopular)
    return {
      label: "Popular",
      icon: Star,
      className: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
    }
  return null
}

const RandomQuizCard: React.FC<{ quiz: any; index: number }> = React.memo(({ quiz, index }) => {
  const [isHovered, setIsHovered] = useState(false)
  const difficulty = getQuizDifficulty(quiz.quizType)
  const { color, badge } = difficultyConfig[difficulty as keyof typeof difficultyConfig]
  const Icon = iconMap[quiz.quizType as keyof typeof iconMap] || HelpCircle
  const status = getQuizStatus(quiz)

  // Simulate some quiz properties for demonstration
  const estimatedTime = Math.floor(Math.random() * 10) + 5
  const questionCount = Math.floor(Math.random() * 15) + 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      layout
      className="group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link href={`/${quizTypeRoutes[quiz.quizType as keyof typeof quizTypeRoutes] || "dashboard/quiz"}/${quiz.slug}`}>
        <Card
          className={cn(
            "transition-all duration-300 overflow-hidden border border-border/50 h-full",
            "hover:shadow-lg hover:border-primary/30 dark:hover:border-primary/40",
            "relative bg-card",
          )}
        >
          {status && (
            <div
              className={cn(
                "absolute top-3 right-3 z-10",
                "flex items-center gap-1 rounded-full px-2 py-0.5",
                status.className,
                "text-xs font-medium",
              )}
            >
              <status.icon className="h-3 w-3" />
              <span>{status.label}</span>
            </div>
          )}

          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300",
              "from-primary/5 to-transparent",
              isHovered ? "opacity-100" : "opacity-0",
            )}
          />

          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <motion.div
                className={cn("rounded-lg p-3", color, "flex-shrink-0")}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>

              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-medium line-clamp-2 leading-tight">{quiz.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className={cn(badge, "text-xs px-2 py-0 h-5")}>
                    {difficulty}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0 h-5 capitalize bg-secondary/30 text-secondary-foreground"
                  >
                    {quiz.quizType.replace("-", " ")}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{estimatedTime} min</span>
                  </div>
                  <div className="flex items-center">
                    <FileQuestion className="h-3 w-3 mr-1" />
                    <span>{questionCount} questions</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium">Completion</p>
                    <p className="text-xs font-medium">{quiz.completionRate || 0}%</p>
                  </div>
                  <Progress value={quiz.completionRate || 0} className="h-1.5 bg-muted" />

                  {quiz.bestScore && (
                    <div className="flex items-center mt-2 text-xs font-medium">
                      <Trophy className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
                      Best Score: {quiz.bestScore}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-primary/70"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: "left" }}
          />
        </Card>
      </Link>
    </motion.div>
  )
})

RandomQuizCard.displayName = "RandomQuizCard"

const QuizCardSkeleton: React.FC = () => (
  <Card className="w-full border border-border/50 overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="h-11 w-11 rounded-lg flex-shrink-0" />
        <div className="flex-grow space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-1.5 w-full mt-2" />
          <Skeleton className="h-4 w-24 mt-1" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export const RandomQuiz: React.FC = () => {
  const { quizzes, isLoading, error } = useRandomQuizzes(6)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState("recommended")

  // Simulate different quiz categories
  const recommendedQuizzes = quizzes.slice(0, 3)
  const popularQuizzes = [...quizzes].slice(3, 6)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  useEffect(() => {
    // Add random properties to quizzes for demonstration
    if (quizzes.length > 0) {
      quizzes.forEach((quiz, index) => {
        quiz.isNew = index === 0
        quiz.isTrending = index === 1
        quiz.isPopular = index === 2
        quiz.completionRate = Math.floor(Math.random() * 100)
        quiz.bestScore = Math.random() > 0.5 ? Math.floor(Math.random() * 100) : null
      })
    }
  }, [quizzes])

  if (error) {
    return (
      <Card className="w-full border border-primary/20 overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quiz Discovery
          </CardTitle>
          <CardDescription>Personalized quizzes for your learning journey</CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-destructive/10 p-3 mb-3">
            <FileQuestion className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-destructive font-medium mb-2">Unable to load quizzes</p>
          <p className="text-muted-foreground text-sm mb-4">We encountered an issue while loading your quizzes.</p>
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border border-primary/20 overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Quiz Discovery
            </CardTitle>
            <CardDescription>Personalized quizzes for your learning journey</CardDescription>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-8 w-8 rounded-full"
            title="Refresh quizzes"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <Tabs defaultValue="recommended" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 border-b">
          <TabsList className="bg-transparent h-12 p-0 w-full justify-start gap-4">
            <TabsTrigger
              value="recommended"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2"
            >
              Recommended
            </TabsTrigger>
            <TabsTrigger
              value="popular"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2"
            >
              Popular
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-6">
          <TabsContent value="recommended" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <>
                    {[...Array(3)].map((_, index) => (
                      <QuizCardSkeleton key={index} />
                    ))}
                  </>
                ) : (
                  <>
                    {recommendedQuizzes.map((quiz, index) => (
                      <RandomQuizCard key={`${quiz.id}-${refreshKey}`} quiz={quiz} index={index} />
                    ))}
                  </>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="popular" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <>
                    {[...Array(3)].map((_, index) => (
                      <QuizCardSkeleton key={index} />
                    ))}
                  </>
                ) : (
                  <>
                    {popularQuizzes.map((quiz, index) => (
                      <RandomQuizCard key={`${quiz.id}-${refreshKey}`} quiz={quiz} index={index} />
                    ))}
                  </>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>

      <CardFooter className="bg-muted/30 p-4 border-t border-border/50">
        <Button className="w-full" variant="default" asChild>
          <Link href="/dashboard/quizzes" className="flex items-center justify-center gap-2">
            <span>Explore All Quizzes</span>
            <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default RandomQuiz

