"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Search, GraduationCap, Clock, CheckCircle, AlertCircle, BookOpen, Loader2, RotateCcw, Eye, Award, Trophy, Target, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { DashboardUser, UserQuiz, UserQuizAttempt } from "@/app/types/types"
import QuizResultsDialog from "./QuizResultsDialog"
import type { QuizType } from "@/app/types/quiz-types"
import { useQuizAttempts } from "@/hooks/useQuizAttempts"
import { toast } from "sonner"

interface QuizzesTabProps {
  userData: DashboardUser
  isLoading?: boolean
}

export default function QuizzesTab({ userData, isLoading = false }: QuizzesTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("quizzes")
  const [selectedAttempt, setSelectedAttempt] = useState<UserQuizAttempt | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [navigatingQuizId, setNavigatingQuizId] = useState<string | null>(null)
  const router = useRouter()

  const { attempts, isLoading: attemptsLoading, resetAttempts } = useQuizAttempts(20)

  // Use useMemo to calculate filtered data only when dependencies change
  const { filteredAllQuizzes, filteredCompletedQuizzes, filteredInProgressQuizzes, filteredAttempts } = useMemo(() => {
    // Filter and sort quizzes with null checks
    const allQuizzes = userData?.userQuizzes || []
    const completedQuizzes = allQuizzes.filter((quiz) => quiz.timeEnded !== null)
    const inProgressQuizzes = allQuizzes.filter((quiz) => quiz.timeEnded === null)

    // Apply search filter
    const filterQuizzes = (quizzes: UserQuiz[]) => {
      if (!searchTerm) return quizzes

      return quizzes.filter((quiz) => quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    const filterAttempts = (attempts: any[]) => {
      if (!searchTerm) return attempts

      return attempts.filter((attempt) => attempt.userQuiz?.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    return {
      filteredAllQuizzes: filterQuizzes(allQuizzes),
      filteredCompletedQuizzes: filterQuizzes(completedQuizzes),
      filteredInProgressQuizzes: filterQuizzes(inProgressQuizzes),
      filteredAttempts: filterAttempts(attempts),
    }
  }, [userData, searchTerm, attempts])

  const getQuizTypeLabel = useCallback((quizType: QuizType) => {
    switch (quizType) {
      case "mcq":
        return "Multiple Choice"
      case "openended":
        return "Open Ended"
      case "blanks":
        return "Fill in the Blanks"
      case "code":
        return "Code"
      case "flashcard":
        return "Flashcards"
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
      case "blanks":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      case "code":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "flashcard":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }, [])

  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 70) return "text-lime-600 dark:text-lime-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    if (score >= 50) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }, [])

  const getScoreIcon = useCallback((score: number) => {
    if (score >= 90) return <Trophy className="h-4 w-4 text-emerald-500" />
    if (score >= 80) return <Target className="h-4 w-4 text-green-500" />
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-yellow-500" />
    return <AlertCircle className="h-4 w-4 text-red-500" />
  }, [])

  const getGradeLabel = useCallback((score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Good"
    if (score >= 70) return "Fair"
    if (score >= 60) return "Pass"
    return "Needs Improvement"
  }, [])

  const formatScore = useCallback((score: number | null | undefined) => {
    if (score === null || score === undefined) return "N/A"
    return `${Math.round(score)}%`
  }, [])

  const calculateProgress = useCallback((quiz: UserQuiz) => {
    if (quiz.timeEnded) return 100
    // For in-progress quizzes, we could calculate based on attempts or other metrics
    // For now, return a base progress value
    return 0
  }, [])

  // Use useCallback to memoize this function
  const handleQuizClick = useCallback(
    (quizId: string, quizType: string, slug: string | undefined) => {
      if (slug) {
        setNavigatingQuizId(quizId)
        router.push(`/dashboard/${quizType}/${slug}`)
        // Reset after navigation (in case user goes back)
        setTimeout(() => setNavigatingQuizId(null), 2000)
      }
    },
    [router],
  )

  const handleResetAttempts = async () => {
    setIsResetting(true)
    try {
      const success = await resetAttempts()
      if (success) {
        toast.success("All quiz attempts have been reset successfully!")
      } else {
        toast.error("Failed to reset quiz attempts. Please try again.")
      }
    } catch (error) {
      toast.error("An error occurred while resetting quiz attempts.")
    } finally {
      setIsResetting(false)
    }
  }

  // Loading skeleton component
  const QuizCardSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // If main data is loading, show skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <QuizCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">My Quizzes</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quizzes">All Quizzes</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="progress">In Progress</TabsTrigger>
          <TabsTrigger value="attempts">
            Quiz Attempts
            {attempts.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {attempts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes" className="space-y-4">
          {filteredAllQuizzes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quizzes Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm ? "No quizzes match your search criteria." : "You haven't created any quizzes yet."}
                </p>
                <Link href="/dashboard">
                  <Button>Create Your First Quiz</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAllQuizzes.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 flex-1">
                        {quiz.title}
                      </CardTitle>
                      <Badge className={getQuizTypeColor(quiz.quizType)} variant="secondary">
                        {getQuizTypeLabel(quiz.quizType)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{(quiz as any)?._count?.questions || quiz.questions?.length || 0} questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(quiz.timeStarted).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {quiz.timeEnded ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm">
                            {quiz.timeEnded ? "Completed" : "In Progress"}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuizClick(quiz.id.toString(), quiz.quizType, quiz.slug)}
                          disabled={navigatingQuizId === quiz.id.toString()}
                        >
                          {navigatingQuizId === quiz.id.toString() ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            quiz.timeEnded ? "Review" : "Continue"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filteredCompletedQuizzes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Quizzes</h3>
                <p className="text-muted-foreground text-center">
                  Complete your first quiz to see it here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompletedQuizzes.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 flex-1">
                        {quiz.title}
                      </CardTitle>
                      <Badge className={getQuizTypeColor(quiz.quizType)} variant="secondary">
                        {getQuizTypeLabel(quiz.quizType)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{(quiz as any)?._count?.questions || quiz.questions?.length || 0} questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(quiz.timeEnded!).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                        {quiz.bestScore !== null && quiz.bestScore !== undefined ? (
                          <div className="flex items-center gap-2">
                            {getScoreIcon(quiz.bestScore)}
                            <div className="text-right">
                              <div className={`text-lg font-bold ${getScoreColor(quiz.bestScore)}`}>
                                {formatScore(quiz.bestScore)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getGradeLabel(quiz.bestScore)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            No Score
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Performance</span>
                          <span>{formatScore(quiz.bestScore)}</span>
                        </div>
                        <Progress 
                          value={quiz.bestScore || 0} 
                          className={`h-2 ${
                            quiz.bestScore && quiz.bestScore >= 80 ? 'bg-green-100' : 
                            quiz.bestScore && quiz.bestScore >= 60 ? 'bg-yellow-100' : 
                            'bg-red-100'
                          }`}
                        />
                      </div>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuizClick(quiz.id.toString(), quiz.quizType, quiz.slug)}
                          disabled={navigatingQuizId === quiz.id.toString()}
                        >
                          {navigatingQuizId === quiz.id.toString() ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            "Review"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {filteredInProgressQuizzes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quizzes in Progress</h3>
                <p className="text-muted-foreground text-center">
                  Create your first quiz to see your progress here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredInProgressQuizzes.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-md transition-shadow border-yellow-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 flex-1">
                        {quiz.title}
                      </CardTitle>
                      <Badge className={getQuizTypeColor(quiz.quizType)} variant="secondary">
                        {getQuizTypeLabel(quiz.quizType)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{(quiz as any)?._count?.questions || quiz.questions?.length || 0} questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Started {new Date(quiz.timeStarted).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-600">In Progress</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleQuizClick(quiz.id.toString(), quiz.quizType, quiz.slug)}
                          disabled={navigatingQuizId === quiz.id.toString()}
                        >
                          {navigatingQuizId === quiz.id.toString() ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            "Continue"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attempts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Quiz Attempts History</h3>
            {attempts.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isResetting}>
                    {isResetting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Reset All Attempts
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset All Quiz Attempts?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all your quiz attempts and reset your statistics. 
                      This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetAttempts}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Reset All Attempts
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {attemptsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading quiz attempts...</span>
              </CardContent>
            </Card>
          ) : filteredAttempts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quiz Attempts</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? "No quiz attempts match your search criteria." : "You haven't completed any quizzes yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAttempts.map((attempt: any) => (
                <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{attempt.userQuiz?.title || 'Quiz'}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{new Date(attempt.createdAt).toLocaleString()}</span>
                            <Badge className={getQuizTypeColor(attempt.userQuiz?.quizType)} variant="secondary">
                              {getQuizTypeLabel(attempt.userQuiz?.quizType)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          {getScoreIcon(attempt.score)}
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getScoreColor(attempt.score)}`}>
                              {formatScore(attempt.score)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {getGradeLabel(attempt.score)}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {attempt.correctAnswers || 0}/{attempt.totalQuestions || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            correct
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAttempt(attempt)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {attempt.timeSpent && (
                            <div className="text-xs text-muted-foreground text-center">
                              {Math.round(attempt.timeSpent / 60)}m
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Progress bar for visual score representation */}
                      <div className="mt-3">
                        <Progress 
                          value={attempt.score || 0} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedAttempt && (
        <QuizResultsDialog
          attempt={selectedAttempt}
          open={true}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </div>
  )
}
