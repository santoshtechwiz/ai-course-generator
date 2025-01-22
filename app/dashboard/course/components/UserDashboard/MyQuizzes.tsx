'use client'
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { BrainCircuit, Clock, Target, Trophy } from "lucide-react"
import type { UserQuiz, QuizType } from "@/app/types"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MyQuizzesProps {
  quizzes: UserQuiz[]
}

const buildQuizSlug = (quizType: QuizType) => {
  switch (quizType) {
    case "mcq":
      return "mcq"
    case "open-ended":
      return "openended"
    case "fill-blanks":
      return "blanks"
    default:
      return "quiz"
  }
}


const getQuizTypeLabel = (quizType: QuizType) => {
  switch (quizType) {
    case "mcq":
      return "Multiple Choice"
    case "open-ended":
      return "Open Ended"
    case "fill-blanks":
      return "Fill in the Blanks"
    default:
      return "Quiz"
  }
}

export function MyQuizzes({ quizzes }: MyQuizzesProps) {
  const [selectedTab, setSelectedTab] = useState<"all" | "completed" | "in-progress">("all")

  const completedQuizzes = quizzes.filter((quiz) => quiz.timeEnded !== null)
  const inProgressQuizzes = quizzes.filter((quiz) => quiz.timeEnded === null)

  const totalQuizzes = quizzes.length
  const completionRate = totalQuizzes > 0 ? (completedQuizzes.length / totalQuizzes) * 100 : 0
  const averageScore =
    completedQuizzes.reduce((sum, quiz) => sum + (quiz.bestScore || 0), 0) / completedQuizzes.length || 0

  const displayQuizzes =
    selectedTab === "all" ? quizzes : selectedTab === "completed" ? completedQuizzes : inProgressQuizzes

  const renderQuizList = (quizzesToRender: UserQuiz[]) => (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {quizzesToRender.map((quiz) => (
          <Link href={`/dashboard/${buildQuizSlug(quiz.quizType)}/${quiz.slug}`} key={quiz.id} className="block">
            <div className="flex items-center justify-between hover:bg-muted p-3 rounded-md transition-colors">
              <div className="space-y-1">
                <p className="font-medium">{quiz.topic}</p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{getQuizTypeLabel(quiz.quizType)}</Badge>
                  {quiz.timeEnded ? (
                    <span className="flex items-center">
                      <Trophy className="w-4 h-4 mr-1" />
                      Best Score: {quiz.bestScore}%
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      In Progress
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm">
                {quiz.timeEnded ? "Review" : "Continue"}
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </ScrollArea>
  )

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>My Quizzes</CardTitle>
      </CardHeader>
      <CardContent>
        {quizzes.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{totalQuizzes}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total Quizzes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{Math.round(completionRate)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">{Math.round(averageScore)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Average Score</p>
                </CardContent>
              </Card>
            </div>

            <Tabs
              defaultValue="all"
              onValueChange={(value) => setSelectedTab(value as "all" | "completed" | "in-progress")}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Quizzes</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                {renderQuizList(displayQuizzes)}
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                {renderQuizList(displayQuizzes)}
              </TabsContent>
              <TabsContent value="in-progress" className="mt-4">
                {renderQuizList(displayQuizzes)}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-6">
            <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No quizzes created yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start your learning journey by creating your first quiz.
            </p>
            <div className="mt-6 space-y-3">
              <Link href="/dashboard/quiz/create" passHref>
                <Button className="w-full">Create a New Quiz</Button>
              </Link>
              <Link href="/dashboard/courses" passHref>
                <Button variant="outline" className="w-full">
                  Explore Courses
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

