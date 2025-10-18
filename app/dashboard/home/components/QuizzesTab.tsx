"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { StatCard } from "@/components/dashboard/StatCard"

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
        return "bg-primary/10 text-primary"
      case "openended":
        return "bg-secondary/10 text-secondary"
      case "blanks":
        return "bg-warning/10 text-warning"
      case "code":
        return "bg-success/10 text-success"
      case "flashcard":
        return "bg-accent/10 text-accent"
      default:
        return "bg-muted text-muted-foreground"
    }
  }, [])

  const buildQuizSlug = useCallback((quizType: QuizType) => {
    switch (quizType) {
      case "mcq":
        return "mcq"
      case "openended":
        return "openended"
      case "blanks":
        return "blanks"
      case "code":
        return "code"
      case "flashcard":
        return "flashcard"
      default:
        return "quiz"
    }
  }, [])

  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return "text-success"
    if (score >= 80) return "text-success"
    if (score >= 70) return "text-warning"
    if (score >= 60) return "text-warning"
    if (score >= 50) return "text-warning"
    return "text-destructive"
  }, [])

  const getScoreIcon = useCallback((score: number) => {
    if (score >= 90) return <Trophy className="h-4 w-4 text-success" />
    if (score >= 80) return <Target className="h-4 w-4 text-success" />
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-warning" />
    return <AlertCircle className="h-4 w-4 text-destructive" />
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
    (quizId: string, quizType: QuizType, slug: string | undefined) => {
      if (slug && quizType) {
        const quizSlug = buildQuizSlug(quizType)
        setNavigatingQuizId(quizId)
        router.push(`/dashboard/${quizSlug}/${slug}`)
        // Reset after navigation (in case user goes back)
        setTimeout(() => setNavigatingQuizId(null), 2000)
      }
    },
    [router, buildQuizSlug],
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
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar - Filters */}
      <div className="lg:w-80 xl:w-96 flex-shrink-0">
        <Card className="sticky top-6 border-2 shadow-[4px_4px_0px_0px_var(--border)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Search Quizzes</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 focus:border-accent"
                />
              </div>
            </div>

            {/* Quiz Type Filter */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Quiz Types</label>
              <div className="space-y-2">
                {[
                  { type: 'mcq', label: 'Multiple Choice', count: filteredAllQuizzes.filter(q => q.quizType === 'mcq').length },
                  { type: 'openended', label: 'Open Ended', count: filteredAllQuizzes.filter(q => q.quizType === 'openended').length },
                  { type: 'blanks', label: 'Fill in Blanks', count: filteredAllQuizzes.filter(q => q.quizType === 'blanks').length },
                  { type: 'code', label: 'Code Quizzes', count: filteredAllQuizzes.filter(q => q.quizType === 'code').length },
                  { type: 'flashcard', label: 'Flashcards', count: filteredAllQuizzes.filter(q => q.quizType === 'flashcard').length },
                ].map(({ type, label, count }) => (
                  <div key={type} className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                      <Checkbox
                        checked={true} // For now, show all - can be made filterable later
                        readOnly
                      />
                      {label}
                    </label>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Status</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <Checkbox
                      checked={true}
                      readOnly
                    />
                    Completed
                  </label>
                  <Badge variant="secondary" className="text-xs">
                    {filteredCompletedQuizzes.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-warning transition-colors">
                    <Checkbox
                      checked={true}
                      readOnly
                    />
                    In Progress
                  </label>
                  <Badge variant="secondary" className="text-xs">
                    {filteredInProgressQuizzes.length}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 pt-4 border-t border-border">
              <label className="text-sm font-medium text-foreground">Quick Actions</label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-2 hover:shadow-[2px_2px_0px_0px_var(--border)]"
                  onClick={() => setSearchTerm('')}
                  disabled={!searchTerm}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                {attempts.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full justify-start border-2 shadow-[2px_2px_0px_0px_var(--border)] hover:shadow-[4px_4px_0px_0px_var(--border)]"
                        disabled={isResetting}
                      >
                        {isResetting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        Reset All Attempts
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-4 border-border shadow-[8px_8px_0px_0px_var(--border)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset All Quiz Attempts?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your quiz attempts and progress. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-2">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetAttempts}
                          className="bg-destructive hover:bg-destructive/90 border-2 shadow-[2px_2px_0px_0px_var(--border)]"
                        >
                          Reset All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-2xl font-bold">My Quizzes</h2>
            <div className="flex items-center gap-2">
              <div className="relative lg:hidden">
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

      {/* Performance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Attempts"
          value={filteredAllQuizzes.length}
          icon={Target}
          variant="default"
          description={filteredAllQuizzes.length === 1 ? "1 quiz taken" : `${filteredAllQuizzes.length} quizzes taken`}
        />
        <StatCard
          label="Average Score"
          value={(() => {
            const completedQuizzes = filteredAllQuizzes.filter(q => q.bestScore !== null && q.bestScore !== undefined)
            if (completedQuizzes.length === 0) return "N/A"
            const avgScore = completedQuizzes.reduce((sum, q) => sum + (q.bestScore || 0), 0) / completedQuizzes.length
            return `${Math.round(avgScore)}%`
          })()}
          icon={Trophy}
          variant={(() => {
            const completedQuizzes = filteredAllQuizzes.filter(q => q.bestScore !== null && q.bestScore !== undefined)
            if (completedQuizzes.length === 0) return 'default' as const
            const avgScore = completedQuizzes.reduce((sum, q) => sum + (q.bestScore || 0), 0) / completedQuizzes.length
            return avgScore >= 80 ? 'success' as const : avgScore >= 60 ? 'warning' as const : 'destructive' as const
          })()}
          description={(() => {
            const completedQuizzes = filteredAllQuizzes.filter(q => q.bestScore !== null && q.bestScore !== undefined)
            if (completedQuizzes.length === 0) return 'No completed quizzes'
            const avgScore = completedQuizzes.reduce((sum, q) => sum + (q.bestScore || 0), 0) / completedQuizzes.length
            if (avgScore >= 90) return '🎉 Excellent work!'
            if (avgScore >= 80) return '👍 Great performance'
            if (avgScore >= 60) return '📈 Keep improving'
            return '💪 Room for growth'
          })()}
        />
        <StatCard
          label="Completed"
          value={filteredCompletedQuizzes.length}
          icon={CheckCircle}
          variant="success"
          description={filteredCompletedQuizzes.length === 1 ? "1 quiz finished" : `${filteredCompletedQuizzes.length} quizzes finished`}
        />
        <StatCard
          label="In Progress"
          value={filteredInProgressQuizzes.length}
          icon={Clock}
          variant={filteredInProgressQuizzes.length > 0 ? 'warning' : 'default'}
          description={filteredInProgressQuizzes.length > 0 ? "🚀 Continue now" : "✅ All caught up!"}
        />
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
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mb-6">
                  <GraduationCap className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Quizzes Found</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {searchTerm ? "No quizzes match your search criteria. Try a different search term." : "Start your learning journey by creating your first quiz!"}
                </p>
                <Link href="/dashboard">
                  <Button className="gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Create Your First Quiz
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAllQuizzes.map((quiz) => (
                <Card key={quiz.id} className="group hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                        {quiz.title}
                      </CardTitle>
                      <Badge className={`${getQuizTypeColor(quiz.quizType)} shrink-0`} variant="secondary">
                        {getQuizTypeLabel(quiz.quizType)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Quiz metadata */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{(quiz as any)?._count?.questions || quiz.questions?.length || 0} questions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(quiz.timeStarted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Status and action */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          {quiz.timeEnded ? (
                            <>
                              <div className="w-2 h-2 bg-success rounded-full"></div>
                              <span className="text-sm font-medium text-success">Completed</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium text-warning">In Progress</span>
                            </>
                          )}
                        </div>
                        <Button
                          variant={quiz.timeEnded ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleQuizClick(quiz.id.toString(), quiz.quizType, quiz.slug)}
                          disabled={navigatingQuizId === quiz.id.toString()}
                          className="gap-2"
                        >
                          {navigatingQuizId === quiz.id.toString() ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Loading...</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>{quiz.timeEnded ? "Review" : "Continue"}</span>
                            </>
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
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-success/10 to-success/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Completed Quizzes</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Complete your first quiz to see your achievements here. Track your progress and celebrate your success!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompletedQuizzes.map((quiz) => (
                <Card key={quiz.id} className="group hover:shadow-lg hover:border-success/30 transition-all duration-200 bg-gradient-to-br from-card to-success/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold line-clamp-2 flex-1 group-hover:text-success transition-colors">
                        {quiz.title}
                      </CardTitle>
                      <Badge className={`${getQuizTypeColor(quiz.quizType)} shrink-0`} variant="secondary">
                        {getQuizTypeLabel(quiz.quizType)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Quiz metadata */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{(quiz as any)?._count?.questions || quiz.questions?.length || 0} questions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(quiz.timeEnded!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Score display */}
                      {quiz.bestScore !== null && quiz.bestScore !== undefined ? (
                        <div className="bg-gradient-to-br from-background to-success/10 rounded-lg p-3 border border-success/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getScoreIcon(quiz.bestScore)}
                              <span className="text-xs font-medium text-muted-foreground">{getGradeLabel(quiz.bestScore)}</span>
                            </div>
                            <div className={`text-2xl font-bold ${getScoreColor(quiz.bestScore)}`}>
                              {formatScore(quiz.bestScore)}
                            </div>
                          </div>
                          <Progress 
                            value={quiz.bestScore} 
                            className={`h-2 ${
                              quiz.bestScore >= 80 ? 'bg-success/20' : 
                              quiz.bestScore >= 60 ? 'bg-warning/20' : 
                              'bg-destructive/20'
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="bg-muted/30 rounded-lg p-3 border border-dashed">
                          <Badge variant="outline" className="text-xs">
                            No Score Available
                          </Badge>
                        </div>
                      )}

                      {/* Action button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuizClick(quiz.id.toString(), quiz.quizType, quiz.slug)}
                        disabled={navigatingQuizId === quiz.id.toString()}
                        className="w-full gap-2 group-hover:bg-green-500/10 group-hover:border-green-500/30"
                      >
                        {navigatingQuizId === quiz.id.toString() ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            <span>Review Results</span>
                          </>
                        )}
                      </Button>
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
                              <Loader2 className="h-4 w-4 mr-2" />
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
                      <Loader2 className="h-4 w-4 mr-2" />
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
                <Loader2 className="h-8 w-8 mr-2" />
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
      </div>
    </div>
  )
}
