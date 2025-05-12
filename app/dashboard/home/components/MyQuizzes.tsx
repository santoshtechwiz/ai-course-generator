"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { BrainCircuit, Clock, Target, Trophy, BookOpen, CheckCircle2 } from "lucide-react"
import type { UserQuiz, QuizType } from "@/app/types/types"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MyQuizzesProps {
  quizzes: UserQuiz[]
}

const buildQuizSlug = (quizType: QuizType) => {
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

const getQuizTypeLabel = (quizType: QuizType) => {
  switch (quizType) {
    case "mcq":
      return "Multiple Choice"
    case "openended":
      return "Open Ended"
    case "fill-blanks":
      return "Fill in the Blanks"
    case "code":
      return "Code"
    default:
      return "Quiz"
  }
}

const getQuizColor = (index: number) => {
  const colors = [
    "bg-red-100 text-red-800",
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
  ]
  return colors[index % colors.length]
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
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {quizzesToRender.map((quiz, index) => (
          <Link
            href={`/dashboard/${buildQuizSlug(quiz.quizType as QuizType)}/${quiz.slug}`}
            key={quiz.id}
            className="block"
          >
            <Card className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-lg">{quiz.title}</p>
                    <div className="flex items-center space-x-2 text-sm">
                      <Badge className={getQuizColor(index)}>{getQuizTypeLabel(quiz.quizType as QuizType)}</Badge>
                      {quiz.timeEnded ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          <Clock className="w-3 h-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {quiz.timeEnded ? (
                      <div className="flex flex-col items-end">
                        <span className="text-sm text-muted-foreground">Best Score</span>
                        <span className="text-2xl font-bold text-green-600">{quiz.bestScore}%</span>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="mt-2">
                        Continue
                      </Button>
                    )}
                  </div>
                </div>
                {!quiz.timeEnded && <Progress value={quiz.progress || 0} className="mt-4" />}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </ScrollArea>
  )

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">My Quizzes</CardTitle>
      </CardHeader>
      <CardContent>
        {quizzes.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <BrainCircuit className="h-6 w-6 text-blue-600" />
                    <span className="text-3xl font-bold text-blue-600">{totalQuizzes}</span>
                  </div>
                  <p className="text-sm font-medium text-blue-600 mt-2">Total Quizzes</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Target className="h-6 w-6 text-green-600" />
                    <span className="text-3xl font-bold text-green-600">{Math.round(completionRate)}%</span>
                  </div>
                  <p className="text-sm font-medium text-green-600 mt-2">Completion Rate</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Trophy className="h-6 w-6 text-purple-600" />
                    <span className="text-3xl font-bold text-purple-600">{Math.round(averageScore)}%</span>
                  </div>
                  <p className="text-sm font-medium text-purple-600 mt-2">Average Score</p>
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
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold text-muted-foreground">No quizzes created yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start your learning journey by creating your first quiz.
            </p>
            <div className="mt-6 space-y-3">
              <Link href="/dashboard/mcq/create" passHref>
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
