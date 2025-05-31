"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Check, X, RefreshCw, Home, Share2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { resetQuiz } from "@/store/slices/quizSlice"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { useSessionService } from "@/hooks/useSessionService"
import type { QuizResult, BaseQuestion } from "../types"

interface TextQuizResultsProps {
  result?: QuizResult;
  isAuthenticated: boolean;
  slug: string;
  quizType: "blanks" | "openended";
  questions?: BaseQuestion[];
  answers?: Record<string, any>;
  quizTitle?: string;
}

export default function TextQuizResults({ 
  result,
  isAuthenticated,
  slug,
  quizType,
  questions = [],
  answers = {},
  quizTitle = ""
}: TextQuizResultsProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { saveAuthRedirectState } = useSessionService()
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})
  const [isResultsReady, setIsResultsReady] = useState(false)
  const [localResults, setLocalResults] = useState<any>(null)
  
  // Initialize local results from props or generate them
  useEffect(() => {
    if (result && !localResults) {
      setLocalResults(result)
      setIsResultsReady(true)
    } else if (!localResults && questions.length > 0 && Object.keys(answers).length > 0) {
      // Generate results from questions and answers
      try {
        const questionArray = Array.isArray(questions) ? questions : []
        const totalCount = questionArray.length
        
        // Calculate scores based on answers
        let correctCount = 0
        let calculatedQuestionResults: any[] = []
        
        // Process answers to calculate scores
        Object.entries(answers).forEach(([questionId, answer]) => {
          const question = questionArray.find(q => q.id?.toString() === questionId)
          if (!question) return
          
          const isCorrect = quizType === "openended" 
            ? (answer as any).isCorrect || ((answer as any).similarity && (answer as any).similarity >= 0.6)
            : (answer as any).userAnswer?.toLowerCase() === question.answer?.toLowerCase()
          
          if (isCorrect) correctCount++
          
          calculatedQuestionResults.push({
            questionId,
            question: question.question || question.text,
            userAnswer: quizType === "openended" ? (answer as any).text : (answer as any).userAnswer,
            correctAnswer: question.answer,
            isCorrect,
            similarity: quizType === "openended" ? (answer as any).similarity : undefined
          })
        })
        
        const percentageCorrect = Math.round((correctCount / totalCount) * 100)
        
        // Generate a result object from calculated data
        const generatedResults = {
          title: quizTitle,
          completedAt: new Date().toISOString(),
          percentage: percentageCorrect,
          score: correctCount,
          maxScore: totalCount,
          questionResults: calculatedQuestionResults
        }
        
        setLocalResults(generatedResults)
        setIsResultsReady(true)
      } catch (error) {
        console.error("Error generating quiz results:", error)
      }
    }
  }, [result, questions, answers, quizTitle, quizType, localResults])
  
  // Log data for debugging
  useEffect(() => {
    console.log("TextQuizResults component state:", { 
      hasResult: !!result,
      hasLocalResults: !!localResults,
      questionCount: questions.length,
      answerCount: Object.keys(answers).length,
      quizTitle,
      isResultsReady
    })
  }, [result, localResults, questions, answers, quizTitle, isResultsReady])
  
  // Memoize calculations based on local state
  const {
    correctQuestions,
    incorrectQuestions,
    correctCount,
    incorrectCount,
    totalCount,
    skippedCount,
    percentageCorrect
  } = useMemo(() => {
    if (!localResults) {
      return {
        correctQuestions: [],
        incorrectQuestions: [],
        correctCount: 0,
        incorrectCount: 0,
        totalCount: 0,
        skippedCount: 0,
        percentageCorrect: 0
      }
    }
    
    const correctQuestions = localResults.questionResults?.filter(q => q.isCorrect) || []
    const incorrectQuestions = localResults.questionResults?.filter(q => !q.isCorrect) || []
    const correctCount = correctQuestions.length
    const incorrectCount = incorrectQuestions.length
    const totalCount = localResults.maxScore || questions.length
    const skippedCount = totalCount - (correctCount + incorrectCount)
    const percentageCorrect = localResults.percentage || Math.round((correctCount / totalCount) * 100)
    
    return {
      correctQuestions,
      incorrectQuestions,
      correctCount,
      incorrectCount,
      totalCount,
      skippedCount,
      percentageCorrect
    }
  }, [localResults, questions.length])
  
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
    setExpandedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }, [])
  
  // Expand all questions
  const expandAllQuestions = useCallback(() => {
    if (!result?.questionResults) return
    
    const expandedState: Record<string, boolean> = {}
    result.questionResults.forEach(q => {
      if (q.questionId) {
        expandedState[q.questionId.toString()] = true
      }
    })
    setExpandedQuestions(expandedState)
  }, [result?.questionResults])
  
  // Collapse all questions
  const collapseAllQuestions = useCallback(() => {
    setExpandedQuestions({})
  }, [])

  // Handle sharing results
  const handleShare = useCallback(async () => {
    if (!localResults) return
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${localResults.title} - Quiz Results`,
          text: `I scored ${percentageCorrect}% on the ${localResults.title} quiz!`,
          url: window.location.href
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
  }, [localResults, percentageCorrect])

  // Handle retaking the quiz
  const handleRetake = useCallback(() => {
    dispatch(resetQuiz())
    router.push(`/dashboard/${quizType}/${slug}?reset=true`)
  }, [dispatch, router, slug, quizType])
  
  // Handle sign in for unauthenticated users
  const handleSignIn = useCallback(async () => {
    if (!isAuthenticated) {
      // Save quiz state before redirecting using Redux state
      saveAuthRedirectState({
        returnPath: `/dashboard/${quizType}/${slug}/results?fromAuth=true`,
        quizState: {
          slug,
          quizData: {
            title: quizTitle,
            questions,
          },
          currentState: {
            answers,
            isCompleted: true,
            showResults: true,
            results: localResults || result,
          },
        },
      })
      
      await signIn(undefined, { callbackUrl: `/dashboard/${quizType}/${slug}/results?fromAuth=true` })
    }
  }, [isAuthenticated, saveAuthRedirectState, slug, quizTitle, questions, answers, localResults, result, quizType])

  // Error state when results can't be loaded
  if (!isResultsReady || !localResults) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
        <h2 className="text-xl font-bold mb-2">Processing Results</h2>
        <p className="text-muted-foreground mb-6">
          We're finalizing your quiz results. This will only take a moment.
        </p>
      </div>
    )
  }
  
  // For unauthenticated users, show limited results
  if (!isAuthenticated) {
    return (
      <Card className="mb-6 bg-gradient-to-b from-background to-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Your Score: {percentageCorrect}%</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to see your detailed results, save your progress, and track your improvement over time.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleSignIn} size="lg">
              Sign In to See Full Results
            </Button>
            <Button variant="outline" onClick={handleRetake} size="lg">
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Full results display for authenticated users
  return (
    <div className="space-y-8">
      {/* Score summary */}
      <Card className="border shadow-sm overflow-hidden bg-gradient-to-br from-card to-card/80">
        <CardHeader className="bg-primary/5 border-b border-border/40">
          <CardTitle className="flex justify-between items-center">
            <span className="text-2xl font-bold">{result.title || quizTitle || "Quiz Results"}</span>
            <Badge variant={percentageCorrect >= 70 ? "success" : percentageCorrect >= 50 ? "warning" : "destructive"} className="text-base px-3 py-1">
              {percentageCorrect}% Score
            </Badge>
          </CardTitle>
          <CardDescription>
            {result.completedAt && (
              <>
                Completed on {new Date(result.completedAt).toLocaleDateString()} at {new Date(result.completedAt).toLocaleTimeString()}
              </>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:justify-between items-center gap-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={percentageCorrect >= 70 ? "hsl(var(--success))" : percentageCorrect >= 50 ? "hsl(var(--warning))" : "hsl(var(--destructive))"}
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
                <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg border border-border/40">
                  <span className="text-2xl font-bold text-success">{correctCount}</span>
                  <span className="text-sm text-muted-foreground">Correct</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg border border-border/40">
                  <span className="text-2xl font-bold text-destructive">{incorrectCount}</span>
                  <span className="text-sm text-muted-foreground">Incorrect</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg border border-border/40">
                  <span className="text-2xl font-bold text-muted-foreground">{skippedCount}</span>
                  <span className="text-sm text-muted-foreground">Skipped</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/30 px-6 py-4 border-t border-border/40 flex flex-wrap gap-3 justify-between">
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleRetake}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Retake Quiz
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push("/dashboard/quizzes")}
            >
              <Home className="w-4 h-4 mr-1" /> All Quizzes
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-1" /> Share
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Question review section */}
      {result.questionResults && result.questionResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Question Review</h2>
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
            {result.questionResults.map((questionResult, index) => {
              if (!questionResult.questionId) return null
              
              // Find the corresponding question data
              const questionData = result.questions?.find(q => q.id?.toString() === questionResult.questionId?.toString()) || 
                                  questions.find(q => q.id?.toString() === questionResult.questionId?.toString())
              
              if (!questionData) return null
              
              const isExpanded = expandedQuestions[questionResult.questionId.toString()]
              const questionText = questionData.question || questionData.text || `Question ${index + 1}`
              const userAnswer = questionResult.userAnswer || questionResult.text || 'Not answered'
              const correctAnswer = questionData.answer || 'Answer unavailable'
              
              // For blanks, replace the blank with the user's answer for preview
              let displayQuestion = questionText
              if (quizType === "blanks" && questionText.includes("________")) {
                displayQuestion = questionText.replace("________", `<span class="px-2 py-0.5 border-b-2 border-dashed">${userAnswer}</span>`)
              }
              
              return (
                <Collapsible 
                  key={questionResult.questionId} 
                  open={isExpanded}
                  onOpenChange={() => toggleQuestion(questionResult.questionId.toString())}
                  className={`border rounded-lg overflow-hidden ${
                    questionResult.isCorrect 
                      ? 'border-success/30 bg-success/5' 
                      : 'border-destructive/30 bg-destructive/5'
                  }`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-1 ${
                        questionResult.isCorrect ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {questionResult.isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-medium">Question {index + 1}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {quizType === "blanks" 
                            ? questionText.replace("________", "______") 
                            : questionText}
                        </p>
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
                      <div className="p-4 bg-card rounded-md">
                        <h4 className="font-medium mb-2">
                          {quizType === "blanks"
                            ? <span dangerouslySetInnerHTML={{ __html: displayQuestion }} />
                            : questionText}
                        </h4>
                      </div>
                      
                      <div className="grid gap-2">
                        <div className={`p-3 rounded-md ${
                          questionResult.isCorrect ? 'bg-success/10 border border-success/30' : 'bg-muted border border-muted-foreground/20'
                        }`}>
                          <div className="flex items-center gap-2">
                            {questionResult.isCorrect && <Check className="w-4 h-4 text-success" />}
                            <span className="font-medium">Your answer:</span>
                          </div>
                          <p className="mt-1">{userAnswer}</p>
                        </div>
                        
                        {!questionResult.isCorrect && (
                          <div className="p-3 rounded-md bg-success/10 border border-success/30">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-success" />
                              <span className="font-medium">Correct answer:</span>
                            </div>
                            <p className="mt-1">{correctAnswer}</p>
                          </div>
                        )}

                        {questionResult.similarity !== undefined && quizType === "openended" && (
                          <div className="p-3 rounded-md bg-primary/10 border border-primary/30">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Similarity score:</span>
                            </div>
                            <p className="mt-1">{Math.round(questionResult.similarity * 100)}%</p>
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
    </div>
  )
}
