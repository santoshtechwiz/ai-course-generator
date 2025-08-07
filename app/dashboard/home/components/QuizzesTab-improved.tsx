"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Search, GraduationCap, Clock, CheckCircle, AlertCircle, BookOpen, Loader2, RotateCcw, Eye, Award } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { DashboardUser, UserQuiz, UserQuizAttempt } from "@/app/types/types"
import QuizResultsDialog from "./QuizResultsDialog"
import type { QuizType } from "@/app/types/quiz-types"
import { useQuizAttempts } from "@/hooks/useQuizAttempts"
import { toast } from "sonner"

interface QuizzesTabProps {
  userData: DashboardUser
}

export default function QuizzesTab({ userData }: QuizzesTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("quizzes")
  const [selectedAttempt, setSelectedAttempt] = useState<UserQuizAttempt | null>(null)
  const [isResetting, setIsResetting] = useState(false)
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
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }, [])

  // Use useCallback to memoize this function
  const handleQuizClick = useCallback(
    (quizId: string, quizType: string, slug: string) => {
      router.push(`/dashboard/${quizType}/${slug}`)
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
                          <span>{quiz.questions?.length || 0} questions</span>
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
                        >
                          {quiz.timeEnded ? "Review" : "Continue"}
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
                          <span>{quiz.questions?.length || 0} questions</span>
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
                          {quiz.bestScore && (
                            <span className={`text-sm font-bold ${getScoreColor(quiz.bestScore)}`}>
                              {Math.round(quiz.bestScore)}%
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuizClick(quiz.id.toString(), quiz.quizType, quiz.slug)}
                        >
                          Review
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
                  Start a quiz to see your progress here.
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
                          <span>{quiz.questions?.length || 0} questions</span>
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
                        >
                          Continue
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
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(attempt.score)}`}>
                            {attempt.score}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {attempt.correctAnswers}/{attempt.totalQuestions} correct
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAttempt(attempt)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
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
          open={!!selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </div>
  )
}
