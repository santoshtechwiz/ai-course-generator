"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Check, X, RefreshCw, Home, Share2, AlertCircle, ChevronDown, ChevronUp, SaveIcon, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useSessionService } from "@/hooks/useSessionService"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { Progress } from "@/components/ui/progress"
import { Trophy, ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useDispatch, useSelector } from "react-redux"
import { 
  saveQuizResultsToDatabase,
  selectIsSaving, 
  selectIsSaved, 
  selectSaveError,
  resetSaveStatus
} from "@/store/slices/quizSlice"
import { AppDispatch } from "@/store"
import { QuizType } from "@/types/quiz"
import { cn } from "@/lib/utils"

interface QuizResult {
  title?: string
  maxScore?: number
  userScore?: number
  score?: number
  percentage?: number
  completedAt?: string
  quizType?: QuizType
  questionResults?: Array<{
    questionId: string | number
    userAnswer?: string
    correctAnswer?: string
    isCorrect?: boolean
    similarity?: number
    question?: string
  }>
  questions?: Array<{
    id?: string | number
    question?: string
    text?: string
    answer?: string
    questionId?: string | number
    userAnswer?: string
    correctAnswer?: string
    isCorrect?: boolean
    similarity?: number
  }>
}

interface QuizResultsProps {
  result?: QuizResult
  onRetake?: () => void
  isAuthenticated: boolean
  slug: string
  quizType: "blanks" | "openended"
  renderQuestionResult?: (question: any) => React.ReactNode
}

export default function TextQuizResults({ result, onRetake, isAuthenticated, slug, quizType, renderQuestionResult }: QuizResultsProps) {
  const router = useRouter()
  
  const dispatch = useDispatch<AppDispatch>()
  const { toast } = useToast()
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})
  
  // Use Redux state for saving status
  const isSaving = useSelector(selectIsSaving)
  const isSaved = useSelector(selectIsSaved)
  const saveError = useSelector(selectSaveError)

  // Reset save status when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetSaveStatus())
    }
  }, [dispatch])

  // Handle save errors
  useEffect(() => {
    if (saveError) {
      toast({
        title: "Error",
        description: saveError || "Failed to save results",
        variant: "destructive",
      })
    }
  }, [saveError, toast])

  // Memoize calculations to avoid recalculating on every render
  const {
    correctQuestions,
    incorrectQuestions,
    correctCount,
    incorrectCount,
    totalCount,
    skippedCount,
    percentageCorrect,
    averageSimilarity,
  } = useMemo(() => {
    if (!result) {
      return {
        correctQuestions: [],
        incorrectQuestions: [],
        correctCount: 0,
        incorrectCount: 0,
        totalCount: 0,
        skippedCount: 0,
        percentageCorrect: 0,
        averageSimilarity: 0,
      }
    }

    const questionData = result.questionResults || result.questions || []
    const correctQuestions = questionData.filter((q) => q.isCorrect)
    const incorrectQuestions = questionData.filter((q) => !q.isCorrect)
    const correctCount = correctQuestions.length
    const incorrectCount = incorrectQuestions.length
    const totalCount = result.maxScore || questionData.length || 0
    const skippedCount = totalCount - (correctCount + incorrectCount)
    const percentageCorrect = result.percentage || Math.round((correctCount / totalCount) * 100)

    // Calculate average similarity for openended/blanks
    let averageSimilarity = 0
    if (questionData.length && (result.quizType === "openended" || result.quizType === "blanks" || result.questionResults?.some(q => typeof q.similarity === "number"))) {
      const similarities = questionData
        .map((q) => typeof q.similarity === "number" ? q.similarity : undefined)
        .filter((s): s is number => typeof s === "number")
      if (similarities.length > 0) {
        averageSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length
      }
    }

    return {
      correctQuestions,
      incorrectQuestions,
      correctCount,
      incorrectCount,
      totalCount,
      skippedCount,
      percentageCorrect,
      averageSimilarity,
    }
  }, [result])

  // Generation functions for the score messages
  const getScoreMessage = useCallback(() => {
    if (percentageCorrect >= 90) return "Outstanding! You've mastered these concepts."
    if (percentageCorrect >= 80) return "Excellent work! Your knowledge is strong."
    if (percentageCorrect >= 70) return "Great job! Keep up the good work."
    if (percentageCorrect >= 60) return "Good effort! Keep practicing to strengthen your skills."
    if (percentageCorrect >= 50) return "You're making progress. More practice will help."
    return "Keep learning! Review the concepts and try again."
  }, [percentageCorrect])

  // Toggle a specific question's expanded state
  const toggleQuestion = useCallback((id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }, [])

  // Expand all questions
  const expandAllQuestions = useCallback(() => {
    const questionData = result?.questionResults || result?.questions || []
    const expandedState: Record<string, boolean> = {}
    questionData.forEach((q) => {
      const questionId = q.questionId || q.id
      if (questionId) {
        expandedState[questionId.toString()] = true
      }
    })
    setExpandedQuestions(expandedState)
  }, [result])

  // Collapse all questions
  const collapseAllQuestions = useCallback(() => {
    setExpandedQuestions({})
  }, [])

  // Handle sharing results
  const handleShare = useCallback(async () => {
    if (!result) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${result.title} - Quiz Results`,
          text: `I scored ${percentageCorrect}% on the ${result.title} quiz!`,
          url: window.location.href,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied to clipboard")
      } else {
        toast.error("Sharing not supported on this device")
      }
    } catch (error) {
      console.error("Error sharing results:", error)
      toast.error("Failed to share results")
    }
  }, [result, percentageCorrect])

  // Handle retaking the quiz
  const handleRetake = useCallback(() => {
    if (onRetake) {
      onRetake()
    } else {
      router.push(`/dashboard/${quizType}/${slug}`)
    }
  }, [onRetake, router, quizType, slug])

  // Handle sign in for unauthenticated users
  const handleSignIn = useCallback(async () => {
    // Save current state for restoration after auth
    if (result) {
      saveAuthRedirectState({
        returnPath: `/dashboard/${quizType}/${slug}/results?fromAuth=true`,
        quizState: {
          slug,
          currentState: {
            results: result,
            showResults: true,
          },
        },
      })
    }

    await signIn(undefined, {
      callbackUrl: `/dashboard/${quizType}/${slug}/results?fromAuth=true`,
    })
  }, [result, slug, quizType, saveAuthRedirectState])

  // Updated saveResultsToDatabase function
  const saveResultsToDatabase = useCallback(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your results",
        variant: "destructive"
      });
      return;
    }

    if (!result) {
      toast({
        title: "Error",
        description: "No results to save",
        variant: "destructive"
      });
      return;
    }

    dispatch(saveQuizResultsToDatabase({ 
      slug, 
      quizType 
    }));
  }, [dispatch, slug, quizType, isAuthenticated, toast, result])

  // Render question content based on quiz type
  const renderQuestionContent = useCallback(
    (questionResult: any, questionData: any, userAnswer: string, correctAnswer: string) => {
      // Calculate similarity and label for openended/blanks
      let similarity = typeof questionResult.similarity === "number"
        ? questionResult.similarity
        : (quizType === "openended" || quizType === "blanks")
          ? getBestSimilarityScore(userAnswer, correctAnswer) / 100
          : undefined

      let similarityLabel: string | undefined = undefined
      if (typeof similarity === "number") {
        if (similarity >= 0.7) similarityLabel = "Correct"
        else if (similarity >= 0.5) similarityLabel = "Close"
        else similarityLabel = "Incorrect"
      }

      // Color for badge
      let badgeColor = "bg-destructive/20 text-destructive"
      if (similarityLabel === "Correct") badgeColor = "bg-success/20 text-success"
      else if (similarityLabel === "Close") badgeColor = "bg-yellow-100 text-yellow-800"

      if (quizType === "blanks") {
        const questionText = questionData?.question || `Question`
        return (
          <div className="p-4 bg-card rounded-md">
            <h4
              className="font-medium mb-2"
              dangerouslySetInnerHTML={{
                __html: questionText.replace(
                  "________",
                  `<span class="px-2 py-0.5 border-b-2 border-dashed">${userAnswer}</span>`,
                ),
              }}
            />
            {typeof similarity === "number" && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Badge className={badgeColor}>
                  {similarityLabel}
                </Badge>
                <span>
                  Similarity: {(similarity * 100).toFixed(0)}%
                </span>
                {similarityLabel === "Close" && (
                  <span className="ml-2 text-xs text-yellow-700 font-semibold">(Close enough!)</span>
                )}
              </div>
            )}
          </div>
        )
      } else {
        // Open-ended quiz
        const questionText = questionResult.question || questionData?.question || questionData?.text || `Question`
        return (
          <div className="p-4 bg-card rounded-md">
            <h4 className="font-medium mb-2">{questionText}</h4>
            {typeof similarity === "number" && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Badge className={badgeColor}>
                  {similarityLabel}
                </Badge>
                <span>
                  Similarity: {(similarity * 100).toFixed(0)}%
                </span>
                {similarityLabel === "Close" && (
                  <span className="ml-2 text-xs text-yellow-700 font-semibold">(Close enough!)</span>
                )}
              </div>
            )}
          </div>
        )
      }
    },
    [quizType],
  )

  // Error state when results can't be loaded
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't load your quiz results properly. Some data might be missing.
        </p>
        <div className="flex gap-3">
          <Button onClick={handleRetake}>Retake Quiz</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    )
  }

  // For unauthenticated users, show limited results with sign-in prompt
  if (!isAuthenticated) {
    return (
      <NonAuthenticatedUserSignInPrompt
        onSignIn={handleSignIn}
        title="Quiz Complete!"
        message="Sign in to see your detailed results, save your progress, and track your improvement over time."
        score={{ percentage: percentageCorrect }}
        resultData={result}
        handleRetake={handleRetake}
      />
    )
  }

  const questionData = result.questionResults || result.questions || []

  // Full results display for authenticated users
  return (
    <div className="space-y-8">
      {/* Score summary */}
      <Card className="border shadow-sm overflow-hidden bg-gradient-to-br from-card to-card/80">
        <CardHeader className="bg-primary/5 border-b border-border/40">
          <CardTitle className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl font-bold">{result.title || "Quiz Results"}</span>
            </div>
            <Badge
              variant={percentageCorrect >= 70 ? "success" : percentageCorrect >= 50 ? "warning" : "destructive"}
              className="text-base px-3 py-1"
            >
              {percentageCorrect}% Score
            </Badge>
          </CardTitle>
          <CardDescription>
            {result.completedAt && (
              <>
                Completed on {new Date(result.completedAt).toLocaleDateString()} at{" "}
                {new Date(result.completedAt).toLocaleTimeString()}
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:justify-between items-center gap-6">
            <div className="relative w-40 h-40 flex flex-col items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={
                    percentageCorrect >= 70
                      ? "hsl(var(--success))"
                      : percentageCorrect >= 50
                        ? "hsl(var(--warning))"
                        : "hsl(var(--destructive))"
                  }
                  strokeWidth="10"
                  strokeDasharray={`${percentageCorrect} 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{correctCount}</span>
                <span className="text-sm text-muted-foreground">of {totalCount}</span>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <p className="text-xl font-medium text-center md:text-left">{getScoreMessage()}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 bg-success/10 rounded-lg border border-success/30">
                  <ThumbsUp className="w-6 h-6 text-success mb-1" />
                  <span className="text-2xl font-bold text-success">{correctCount}</span>
                  <span className="text-sm text-muted-foreground">Correct</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                  <ThumbsDown className="w-6 h-6 text-destructive mb-1" />
                  <span className="text-2xl font-bold text-destructive">{incorrectCount}</span>
                  <span className="text-sm text-muted-foreground">Incorrect</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-muted/40 rounded-lg border border-muted-foreground/20">
                  <HelpCircle className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-2xl font-bold text-muted-foreground">{skippedCount}</span>
                  <span className="text-sm text-muted-foreground">Skipped</span>
                </div>
              </div>
              {/* Show average similarity for openended/blanks */}
              {(result.quizType === "openended" || result.quizType === "blanks" || averageSimilarity > 0) && (
                <div className="flex flex-col items-center mt-2 w-full">
                  <span className="text-base font-medium text-primary mb-1">
                    This reflects how close your answers were to the correct ones.
                  </span>
                  <Progress
                    value={averageSimilarity * 100}
                    className={cn("h-2 w-full max-w-xs bg-muted/60")}
                   
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 px-6 py-4 border-t border-border/40 flex flex-wrap gap-3 justify-between">
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={handleRetake}>
              <RefreshCw className="w-4 h-4 mr-1" /> Retake Quiz
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/quizzes")}>
              <Home className="w-4 h-4 mr-1" /> All Quizzes
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" /> Share
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Question review section */}
      {questionData.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Question Review
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={expandAllQuestions}>
                <ChevronDown className="w-4 h-4 mr-1" /> Expand All
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAllQuestions}>
                <ChevronUp className="w-4 h-4 mr-1" /> Collapse All
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {questionData.map((questionResult, index) => {
              const questionId = questionResult.questionId || questionResult.id
              if (!questionId) return null

              // Find the corresponding question data for blanks quiz
              const questionDataItem =
                quizType === "blanks"
                  ? result.questions?.find((q) => q.id?.toString() === questionId?.toString())
                  : null

              const isExpanded = expandedQuestions[questionId.toString()]
              const userAnswer = questionResult.userAnswer || "Not answered"
              const correctAnswer = questionResult.correctAnswer || questionDataItem?.answer || "Answer unavailable"
              const similarity = questionResult.similarity || 0

              // Color for border and background
              const borderColor =
                questionResult.isCorrect
                  ? "border-success/40 bg-success/5"
                  : similarity >= 0.5
                  ? "border-yellow-400/40 bg-yellow-50"
                  : "border-destructive/40 bg-destructive/5"

              return (
                <Collapsible
                  key={questionId}
                  open={isExpanded}
                  onOpenChange={() => toggleQuestion(questionId.toString())}
                  className={`border rounded-lg overflow-hidden ${borderColor} transition-all duration-200`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-1 ${
                          questionResult.isCorrect
                            ? "bg-success/20 text-success"
                            : similarity >= 0.5
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {questionResult.isCorrect ? (
                          <Check className="w-5 h-5" />
                        ) : similarity >= 0.5 ? (
                          <HelpCircle className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">Question {index + 1}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {quizType === "blanks"
                            ? (questionDataItem?.question || "").replace("________", "______")
                            : questionResult.question || "Question text"}
                        </p>
                        {typeof similarity === "number" && (
                          <p className="text-xs text-muted-foreground">
                            Similarity: {Math.round(similarity * 100)}%
                          </p>
                        )}
                      </div>
                    </div>

                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                      {renderQuestionContent(questionResult, questionDataItem, userAnswer, correctAnswer)}

                      <div className="grid gap-2">
                        <div
                          className={`p-3 rounded-md ${
                            questionResult.isCorrect
                              ? "bg-success/10 border border-success/30"
                              : similarity >= 0.5
                              ? "bg-yellow-50 border border-yellow-200"
                              : "bg-muted border border-muted-foreground/20"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {questionResult.isCorrect && <Check className="w-4 h-4 text-success" />}
                            {!questionResult.isCorrect && similarity >= 0.5 && (
                              <HelpCircle className="w-4 h-4 text-yellow-700" />
                            )}
                            <span className="font-medium">Your answer:</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap">{userAnswer}</p>
                        </div>

                        {!questionResult.isCorrect && (
                          <div className="p-3 rounded-md bg-success/10 border border-success/30">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-success" />
                              <span className="font-medium">
                                {quizType === "blanks" ? "Correct answer:" : "Expected answer:"}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap">{correctAnswer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </div>
      )}

      {/* Save results section */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between items-center gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Save Your Results</h2>
              <p className="text-sm text-muted-foreground">
                Save your quiz results to track your progress over time and review them later.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="default" 
              size="lg" 
              onClick={saveResultsToDatabase} 
              disabled={isSaving || isSaved}
              className={isSaved ? "bg-success hover:bg-success/90" : ""}
            >
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Results Saved
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save Results
                </>
              )}
            </Button>
            
            {isSaved && (
              <span className="text-sm text-success">
                Your quiz results have been saved to your profile!
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
