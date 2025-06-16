"use client"

import { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { clearQuizState } from "@/store/slices/quiz-slice"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Home,
  Target,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Award,
  FileQuestion
} from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizResultsSummary } from "@/components/ui/quiz-results-summary"
import { QuizConfetti } from "@/components/ui/quiz-confetti"

interface McqQuizResultProps {
  result: {
    quizId: string | number
    slug: string
    title: string
    completedAt: string
    score: number
    maxScore: number
    percentage: number
    questions: {
      id: string | number
      questionId?: string | number
      question: string
      text?: string
      prompt?: string
      correctAnswer: string
      answer?: string
      correctOptionId?: string | number
      options?: any[]
      userAnswer?: string
      submittedAnswer?: string
      // Add any other possible question properties
      [key: string]: any
    }[]
    answers: {
      questionId: string | number
      id?: string | number
      userAnswer?: string
      answer?: string
      text?: string
      selectedOptionId?: string | number
      isCorrect: boolean
      // Add any other possible answer properties
      [key: string]: any
    }[]
    // Add questionResults property that might be present in normalized results
    questionResults?: {
      questionId: string | number
      id?: string | number
      question?: string
      correctAnswer?: string
      userAnswer?: string
      isCorrect?: boolean
      type?: string
      similarity?: number
      timeSpent?: number
      selectedOptionId?: string | number
      // Add any other possible properties
      [key: string]: any
    }[]
    // Add metrics property from latest normalization
    metrics?: {
      correct: number
      incorrect: number
      total: number
      percentage: number
      [key: string]: any
    }
    [key: string]: any // Allow other properties
  }
  onRetake?: () => void
}

const getPerformanceData = (percentage: number) => {
  if (percentage >= 90) return { label: "Excellent", color: "emerald", message: "Outstanding work!" }
  if (percentage >= 80) return { label: "Very Good", color: "blue", message: "Great job!" }
  if (percentage >= 70) return { label: "Good", color: "green", message: "Well done!" }
  if (percentage >= 60) return { label: "Fair", color: "yellow", message: "You're getting there." }
  if (percentage >= 50) return { label: "Needs Work", color: "orange", message: "Review the material." }
  return { label: "Poor", color: "red", message: "Try again after studying." }
}

export default function McqQuizResult({ result, onRetake }: McqQuizResultProps) {
  const dispatch = useDispatch()
  const router = useRouter()

  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const handleRetake = useCallback(() => {
    if (onRetake) return onRetake()
    dispatch(clearQuizState())
    router.push(`/dashboard/mcq/${result.slug}`)
  }, [onRetake, dispatch, router, result.slug])
  
  const handleBrowse = () => {
    router.push("/dashboard/quizzes")
  }

  const toggleQuestion = useCallback((id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const performance = useMemo(() => getPerformanceData(result.percentage), [result.percentage])
  
  const formattedDate = useMemo(() => {
    try {
      return new Date(result.completedAt).toLocaleDateString()
    } catch {
      return "Recently"
    }
  }, [result.completedAt])
  
  // Format time spent for display
  const formattedTimeSpent = useMemo(() => {
    const totalTimeInSeconds = result.totalTime || 0;
    if (totalTimeInSeconds < 60) {
      return `${totalTimeInSeconds} sec`
    }
    const minutes = Math.floor(totalTimeInSeconds / 60)
    const seconds = totalTimeInSeconds % 60
    return `${minutes}m ${seconds}s`
  }, [result.totalTime])
  
  const metrics = useMemo(() => {
    // First check if result has a metrics object from the latest normalization
    if (result.metrics && typeof result.metrics === 'object') {
      const { correct, total, percentage, incorrect } = result.metrics;
      if (typeof correct === 'number' && typeof total === 'number') {
        return {
          correct,
          total,
          percentage: typeof percentage === 'number' ? percentage : 
                     (total > 0 ? Math.round((correct / total) * 100) : 0),
          incorrect: typeof incorrect === 'number' ? incorrect : (total - correct)
        };
      }
    }
    
    // Calculate correct answers from all possible sources
    const questionResultsCorrect = Array.isArray(result.questionResults) ? 
      result.questionResults.filter(qr => qr.isCorrect === true).length : 0;
      
    const answersCorrect = Array.isArray(result.answers) ? 
      result.answers.filter(a => a.isCorrect === true).length : 0;
      
    // Take the most reliable score source in order of preference
    const score = typeof result.score === 'number' ? result.score : 
                 questionResultsCorrect > 0 ? questionResultsCorrect :
                 answersCorrect > 0 ? answersCorrect : 0;
    
    // Calculate total with fallbacks
    const total = typeof result.maxScore === 'number' ? result.maxScore : 
                 Array.isArray(result.questions) ? result.questions.length : 
                 Array.isArray(result.questionResults) ? result.questionResults.length : 0;
    
    // Calculate percentage with proper validation
    const percentage = typeof result.percentage === 'number' ? result.percentage : 
                      (total > 0 ? Math.round((score / total) * 100) : 0);
    
    return {
      correct: score,
      total: total,
      percentage: percentage,
      incorrect: total - score
    };
  }, [result])
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* Overview Card */}
      <Card className="overflow-hidden border-2">
        <CardHeader className="bg-muted/50">
          <div className="flex flex-col gap-2">
            <Badge className="w-fit" variant="outline">{result.title}</Badge>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Quiz Results
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-4 h-4" />
              Completed on {formattedDate}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <QuizResultsSummary
            score={metrics.percentage}
            correctAnswers={metrics.correct}
            totalQuestions={metrics.total}
            totalTimeSpent={result.totalTime || 0}
            formattedTimeSpent={formattedTimeSpent}
            quizType="mcq"
          />
        </CardContent>
      </Card>

      {/* CTA Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleRetake} className="gap-2 shadow">
          <RefreshCw className="w-4 h-4" />
          Retake Quiz
        </Button>
        <Button variant="outline" onClick={handleBrowse} className="gap-2">
          <BookOpen className="w-4 h-4" />
          Browse Quizzes
        </Button>
      </div>      {/* Question Breakdown */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/50 border-b">
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-primary" />
            Question Breakdown
          </CardTitle>
          <div className="space-x-2">
            <Button size="sm" variant="secondary" onClick={() => {
              const allIds = result.questions.map((q) => String(q.id || q.questionId || ""))
              setExpandedQuestions(new Set(allIds))
            }}>
              Expand All
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExpandedQuestions(new Set())}>
              Collapse All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">          {result.questions.map((q, index) => {            // Enhanced answer matching with comprehensive fallbacks
            const qid = String(q.id || q.questionId || "");
            
            // 1. Try direct matching by ID first (most reliable)
            let answer = result.answers?.find(a => 
              String(a.questionId) === qid || 
              String(a.id) === qid
            );
            
            // 2. Try matching through questionResults array if available
            let questionResult = result.questionResults?.find(qr => 
              String(qr.questionId) === qid || 
              String(qr.id) === qid
            );
            
            // 3. Try index-based matching for both answers and questionResults as fallbacks
            if (!answer && result.answers && result.answers[index]) {
              answer = result.answers[index];
            }
            
            if (!questionResult && result.questionResults && result.questionResults[index]) {
              questionResult = result.questionResults[index];
            }
            
            // Comprehensive question text extraction with multiple fallbacks
            const questionText = q.question || q.text || q.prompt || 
                              questionResult?.question || "";
            
            // Extract correct answer with multiple property checks across all sources
            const correctAnswer = q.correctAnswer || q.answer || q.correctOptionId || 
                              questionResult?.correctAnswer || "";// ULTRA-COMPREHENSIVE answer extraction for MCQ questions
            // This handles all edge cases including conceptual questions like Angular questions
              // Helper function to safely check if a value exists and isn't empty
            const hasValue = (val: any): boolean => {
                if (val === undefined || val === null) return false;
                if (typeof val === 'string') return val.trim() !== '';
                if (typeof val === 'object') return Object.keys(val).length > 0;
                return true;
            };
            
            // ALL possible answer sources in priority order:
            
            // 1. Direct answer from answer object - highest priority with type safety
            const directAnswer = answer && (
                hasValue(answer.userAnswer) ? answer.userAnswer :
                hasValue(answer.selectedOptionId) ? answer.selectedOptionId :
                hasValue(answer.answer) ? answer.answer :
                hasValue(answer.text) ? answer.text : null
            );
            
            // 2. Results object answers with type safety
            const resultsAnswer = questionResult && (
                hasValue(questionResult.userAnswer) ? questionResult.userAnswer :
                hasValue(questionResult.selectedOptionId) ? questionResult.selectedOptionId : null
            );
            
            // 3. Question object answers (sometimes stored here)
            const questionAnswer = hasValue(q.userAnswer) ? q.userAnswer :
                                hasValue(q.submittedAnswer) ? q.submittedAnswer :
                                hasValue(q.response) ? q.response : null;
                                  // 4. Specialized conceptual answer locations with type safety
            const conceptualAnswer = 
                (answer && hasValue(answer.conceptualAnswer) ? answer.conceptualAnswer : null) ||
                (hasValue(q.conceptualAnswer) ? q.conceptualAnswer : null) ||
                (answer && answer.metadata && hasValue(answer.metadata.answer) ? answer.metadata.answer : null) ||
                (q.content && hasValue(q.content.answer) ? q.content.answer : null);
                                  
            // 5. Check other index-based locations in arrays as last resort 
            const alternateIndexAnswer = result.answers?.[index]?.userAnswer || result.answers?.[index]?.answer;
                                  
            // 6. For Angular or framework-specific questions, check subject-specific fields with type safety
            const frameworkAnswer = (answer && hasValue(answer.angularAnswer) ? answer.angularAnswer : null) ||
                                 (hasValue(q.angularAnswer) ? q.angularAnswer : null);
            
            // 7. Get selected option text if we have an option ID
            let selectedOptionText = "";
            const optionId = answer?.selectedOptionId || questionResult?.selectedOptionId;
            
            if (hasValue(optionId) && Array.isArray(q.options)) {
              const option = q.options.find((opt: any) => {
                const optId = typeof opt === 'object' ? String(opt.id) : String(opt);
                return optId === String(optionId);
              });
              
              if (option) {
                selectedOptionText = typeof option === 'object' ? 
                  (option.text || option.label || String(option.id)) : 
                  String(option);
              }
            }
            
            // Combine all sources with fallbacks - ANY non-empty value will be used
            const rawUserAnswer = directAnswer || resultsAnswer || questionAnswer || 
                                conceptualAnswer || alternateIndexAnswer || frameworkAnswer || 
                                selectedOptionText || "";
                               
            // Never let a valid answer slip through - handle all data types 
            const userAnswerStr = typeof rawUserAnswer === 'string' ? rawUserAnswer.trim() : 
                                typeof rawUserAnswer === 'object' ? JSON.stringify(rawUserAnswer).trim() : 
                                String(rawUserAnswer || "").trim();
                                
            // Only show null when truly empty after all our extraction attempts
            const userAnswer = userAnswerStr !== "" ? rawUserAnswer : null;
            
            // Get correctness with comprehensive fallback paths
            const isCorrect = 
              answer?.isCorrect === true || 
              questionResult?.isCorrect === true ||
              false;
                const expanded = expandedQuestions.has(qid)
            
            return (
              <Collapsible
                key={qid || index}
                open={expanded}
                onOpenChange={() => toggleQuestion(String(q.id || q.questionId || index))}
                className="border rounded-lg shadow-sm overflow-hidden"
              >
                <CollapsibleTrigger asChild>
                  <div className={cn(
                    "cursor-pointer hover:bg-muted/70 px-4 py-3 transition-all flex items-center justify-between w-full",
                    isCorrect 
                      ? "bg-green-50 dark:bg-green-950 border-b border-green-200 dark:border-green-900" 
                      : "bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-900"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "rounded-full w-8 h-8 flex items-center justify-center",
                        isCorrect ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : 
                                  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      )}>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Question {index + 1}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {questionText.length > 60 ? `${questionText.substring(0, 60)}...` : questionText}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isCorrect ? "success" : "destructive"} className={cn(
                        "hidden sm:inline-flex",
                        isCorrect ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300" : 
                                  "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300"
                      )}>
                        {isCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 space-y-4 bg-card">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5">Question</Badge>
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      </div>
                      <p className="text-foreground p-3 bg-muted/50 rounded-md">{questionText}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Badge variant="outline" className="bg-primary/5">Your Answer</Badge>
                      {userAnswer === null ? (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-md">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <p className="text-red-600 dark:text-red-400 italic">Not answered</p>
                        </div>
                      ) : (
                        <p className="p-3 bg-muted/50 border rounded-md whitespace-pre-wrap">
                          {userAnswer}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Badge variant="outline" className="bg-primary/5">Correct Answer</Badge>
                      {!correctAnswer ? (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded-md">
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                          <p className="text-yellow-600 dark:text-yellow-400 italic">Answer unavailable</p>
                        </div>
                      ) : (
                        <p className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-md whitespace-pre-wrap">
                          {correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
