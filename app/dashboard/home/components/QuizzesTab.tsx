"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, PlusCircle, GraduationCap, Clock, CheckCircle, AlertCircle, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { DashboardUser, UserQuiz, UserQuizAttempt, QuizType } from "@/app/types/types"
import QuizResultsDialog from "./QuizResultsDialog"

interface QuizzesTabProps {
  userData: DashboardUser
}

export default function QuizzesTab({ userData }: QuizzesTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("quizzes")
  const [selectedAttempt, setSelectedAttempt] = useState<UserQuizAttempt | null>(null)
  const [loadingQuizId, setLoadingQuizId] = useState<string | null>(null)
  const router = useRouter()

  // Use useMemo to calculate filtered data only when dependencies change
  const {
    filteredAllQuizzes,
    filteredCompletedQuizzes,
    filteredInProgressQuizzes,
    filteredAttempts
  } = useMemo(() => {
    // Filter and sort quizzes with null checks
    const allQuizzes = userData?.userQuizzes || []
    const completedQuizzes = allQuizzes.filter((quiz) => quiz.timeEnded !== null)
    const inProgressQuizzes = allQuizzes.filter((quiz) => quiz.timeEnded === null)
    const quizAttempts = userData?.quizAttempts || []

    // Apply search filter
    const filterQuizzes = (quizzes: UserQuiz[]) => {
      if (!searchTerm) return quizzes

      return quizzes.filter((quiz) => quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    const filterAttempts = (attempts: UserQuizAttempt[]) => {
      if (!searchTerm) return attempts

      return attempts.filter((attempt) => attempt.userQuiz?.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    return {
      filteredAllQuizzes: filterQuizzes(allQuizzes),
      filteredCompletedQuizzes: filterQuizzes(completedQuizzes),
      filteredInProgressQuizzes: filterQuizzes(inProgressQuizzes),
      filteredAttempts: filterAttempts(quizAttempts)
    }
  }, [userData, searchTerm])

  const getQuizTypeLabel = useCallback((quizType: QuizType) => {
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
  }, [])

  const getQuizTypeColor = useCallback((quizType: QuizType) => {
    switch (quizType) {
      case "mcq":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "openended":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "fill-blanks":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      case "code":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }, [])

  // Use useCallback to memoize this function
  const handleQuizClick = useCallback((quizId: string, quizType: string, slug: string) => {
    setLoadingQuizId(quizId)
    // Use requestAnimationFrame to ensure this happens after render
    requestAnimationFrame(() => {
      router.push(`/dashboard/${quizType}/${slug}`)
    })
  }, [router])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">My Quizzes</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search quizzes..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button asChild>
            <Link href="/dashboard/quiz/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Quiz
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
        <TabsList>
          <TabsTrigger value="quizzes">My Quizzes ({filteredAllQuizzes.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({filteredInProgressQuizzes.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filteredCompletedQuizzes.length})</TabsTrigger>
          <TabsTrigger value="attempts">Quiz Attempts ({filteredAttempts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes" className="mt-6">
          <QuizGrid
            quizzes={filteredAllQuizzes}
            getQuizTypeLabel={getQuizTypeLabel}
            getQuizTypeColor={getQuizTypeColor}
            loadingQuizId={loadingQuizId}
            onQuizClick={handleQuizClick}
          />
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          <QuizGrid
            quizzes={filteredInProgressQuizzes}
            getQuizTypeLabel={getQuizTypeLabel}
            getQuizTypeColor={getQuizTypeColor}
            loadingQuizId={loadingQuizId}
            onQuizClick={handleQuizClick}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <QuizGrid
            quizzes={filteredCompletedQuizzes}
            getQuizTypeLabel={getQuizTypeLabel}
            getQuizTypeColor={getQuizTypeColor}
            loadingQuizId={loadingQuizId}
            onQuizClick={handleQuizClick}
          />
        </TabsContent>

        <TabsContent value="attempts" className="mt-6">
          <AttemptsList
            attempts={filteredAttempts}
            onViewDetails={setSelectedAttempt}
            getQuizTypeLabel={getQuizTypeLabel}
            getQuizTypeColor={getQuizTypeColor}
          />
        </TabsContent>
      </Tabs>

      {selectedAttempt && (
        <QuizResultsDialog
          attempt={selectedAttempt}
          open={!!selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </div>
  )
}

interface QuizGridProps {
  quizzes: UserQuiz[]
  getQuizTypeLabel: (type: QuizType) => string
  getQuizTypeColor: (type: QuizType) => string
  loadingQuizId: string | null
  onQuizClick: (quizId: string, quizType: string, slug: string) => void
}

function QuizGrid({ quizzes, getQuizTypeLabel, getQuizTypeColor, loadingQuizId, onQuizClick }: QuizGridProps) {
  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No quizzes found</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
            You don't have any quizzes in this category. Create a new quiz to get started!
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/quiz/create">Create Quiz</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quizzes.map((quiz) => (
        <Card
          key={quiz.id}
          className={`overflow-hidden transition-all duration-300 ${
            loadingQuizId === quiz.id ? "opacity-70 scale-[0.98] shadow-sm" : "hover:shadow-md hover:scale-[1.01]"
          }`}
          onClick={() => onQuizClick(quiz.id, quiz.quizType as string, quiz.slug as string)}
        >
          <CardContent className="p-4 relative cursor-pointer">
            {loadingQuizId === quiz.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <Badge className={getQuizTypeColor(quiz.quizType as QuizType)}>
                {getQuizTypeLabel(quiz.quizType as QuizType)}
              </Badge>
              {quiz.timeEnded ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  In Progress
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1 mt-2">
              {quiz.title}
            </h3>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <BookOpen className="mr-1 h-4 w-4" />
                <span>{quiz.questions?.length || 0} questions</span>
              </div>

              {quiz.timeEnded && (
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{quiz.bestScore || 0}%</div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Button>{quiz.timeEnded ? "Review Quiz" : "Continue Quiz"}</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

interface AttemptsListProps {
  attempts: UserQuizAttempt[]
  onViewDetails: (attempt: UserQuizAttempt) => void
  getQuizTypeLabel: (type: QuizType) => string
  getQuizTypeColor: (type: QuizType) => string
}

function AttemptsList({ attempts, onViewDetails, getQuizTypeLabel, getQuizTypeColor }: AttemptsListProps) {
  if (attempts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No quiz attempts found</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
            You haven't attempted any quizzes yet. Take a quiz to see your results here!
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/quizzes">Browse Quizzes</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {attempts.map((attempt) => (
        <Card
          key={attempt.id}
          className="overflow-hidden hover:shadow-md transition-all duration-300 hover:scale-[1.005]"
        >
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg line-clamp-1">{attempt.userQuiz?.title || "Quiz"}</h3>
                  {attempt.userQuiz?.quizType && (
                    <Badge className={getQuizTypeColor(attempt.userQuiz.quizType as QuizType)}>
                      {getQuizTypeLabel(attempt.userQuiz.quizType as QuizType)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{new Date(attempt.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    <span>{attempt.timeSpent}s spent</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span
                    className={`text-xl font-bold ${
                      (attempt.score || 0) >= 70
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {attempt.score || 0}%
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-sm text-muted-foreground">Accuracy</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{attempt.accuracy || 0}%</span>
                </div>

                <Button onClick={() => onViewDetails(attempt)} className="transition-all hover:scale-105">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
