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
  Code,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import SyntaxHighlighter from "react-syntax-highlighter"
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs"

interface CodeQuizResultProps {
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
      code?: string
      codeSnippet?: string
      language?: string
      correctAnswer: string
      answer?: string
      explanation?: string
      expectedOutput?: string
      userAnswer?: string
      submittedAnswer?: string
      // Add any other possible properties
      [key: string]: any
    }[]
    answers: {
      questionId: string | number
      id?: string | number
      userAnswer?: string
      answer?: string
      code?: string
      text?: string
      isCorrect: boolean
      // Add any other possible properties
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

export default function CodeQuizResult({ result, onRetake }: CodeQuizResultProps) {
  const dispatch = useDispatch()
  const router = useRouter()
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const handleRetake = useCallback(() => {
    if (onRetake) return onRetake()
    dispatch(clearQuizState())
    router.push(`/dashboard/code/${result.slug}`)
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
  
  // Enhanced metrics calculation with better fallbacks and metrics object
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
      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <Badge className="w-fit">{result.title}</Badge>
            <CardTitle className="text-3xl">Code Quiz Results</CardTitle>
            <CardDescription className="flex items-center gap-2 text-muted-foreground text-sm">
              <Code className="w-4 h-4" />
              Completed on {formattedDate}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6 pt-4">
          <div>
            <span className="text-muted-foreground text-sm">Score</span>
            <div className="text-2xl font-semibold">{metrics.correct} / {metrics.total}</div>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">Accuracy</span>
            <div className="text-2xl font-semibold text-blue-600">{metrics.percentage}%</div>
          </div>
          <div>
            <span className="text-muted-foreground text-sm">Performance</span>
            <div className={cn(
              "text-2xl font-semibold",
              `text-${performance.color}-600`
            )}>
              {performance.label}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleRetake} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Retake Quiz
        </Button>
        <Button variant="outline" onClick={handleBrowse} className="gap-2">
          <BookOpen className="w-4 h-4" />
          Browse Quizzes
        </Button>
      </div>

      {/* Breakdown */}
      <Card>        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Question Breakdown</CardTitle>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={() => {
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
        <CardContent className="space-y-3">          {result.questions.map((q, index) => {
            // Get normalized question ID with all possible fallbacks
            const qid = String(q.id || q.questionId || index);
            
            // THREE-PHASE ANSWER MATCHING STRATEGY 
            // Phase 1: Direct ID matching (most reliable)
            let answer = result.answers?.find(a => 
              String(a.questionId) === qid || 
              String(a.id) === qid
            );
            
            let questionResult = result.questionResults?.find(qr => 
              String(qr.questionId) === qid || 
              String(qr.id) === qid
            );
            
            // Phase 2: Try more relaxed matching if needed
            if (!answer && result.answers) {
              // Try matching by index first
              if (result.answers[index]) {
                answer = result.answers[index];
              }
              
              // If still not found, try fuzzy matching by looking at answer content
              if (!answer && typeof q.question === 'string') {
                // Find by question text similarity (sometimes IDs don't match but question text does)
                answer = result.answers.find(a => 
                  (a.question && q.question && 
                   String(a.question).toLowerCase().includes(q.question.toLowerCase().substring(0, 15)))
                );
              }
            }
            
            // Phase 3: Get from questionResults as final fallback
            if (!questionResult && result.questionResults) {
              if (result.questionResults[index]) {
                questionResult = result.questionResults[index];
              }
            }
            
            // Extract question text using comprehensive fallbacks - prioritize the most descriptive
            // First check if question has detailed properties
            let questionText = "";
            
            if (typeof q.question === 'string' && q.question.trim().length > 0) {
              questionText = q.question;
            } else if (typeof q.text === 'string' && q.text.trim().length > 0) {
              questionText = q.text;
            } else if (typeof q.prompt === 'string' && q.prompt.trim().length > 0) {
              questionText = q.prompt;
            } else if (questionResult && typeof questionResult.question === 'string') {
              questionText = questionResult.question;
            } else if (answer && typeof answer.question === 'string') {
              questionText = answer.question;
            }
            
            // Extract code snippet with enhanced fallbacks and type safety
            let codeSnippet = "";
            
            // First try question object (most reliable source)
            if (typeof q.code === 'string' && q.code.trim().length > 0) {
              codeSnippet = q.code;
            } else if (typeof q.codeSnippet === 'string' && q.codeSnippet.trim().length > 0) {
              codeSnippet = q.codeSnippet;
            } 
            // Then try answer object
            else if (answer) {
              if (typeof answer.code === 'string' && answer.code.trim().length > 0) {
                codeSnippet = answer.code;
              } else if (typeof answer.codeSnippet === 'string' && answer.codeSnippet.trim().length > 0) {
                codeSnippet = answer.codeSnippet;
              }
            }
            // Finally check questionResult object
            else if (questionResult) {
              if (typeof questionResult.code === 'string' && questionResult.code.trim().length > 0) {
                codeSnippet = questionResult.code;
              } else if (typeof questionResult.codeSnippet === 'string' && questionResult.codeSnippet.trim().length > 0) {
                codeSnippet = questionResult.codeSnippet;
              }
            }
            
            // Get language with multiple fallbacks - default to javascript for syntax highlighting
            const codeLanguage = q.language || answer?.language || questionResult?.language || "javascript";
            
            // ULTRA-COMPREHENSIVE answer extraction with stronger type safety
            // Helper function to safely check if a value exists and isn't empty
            const hasValue = (val: any): boolean => {
                if (val === undefined || val === null) return false;
                if (typeof val === 'string') return val.trim() !== '';
                if (typeof val === 'object' && val !== null) return Object.keys(val).length > 0;
                return false;
            };
            
            // ALL possible answer sources in priority order:
            
            // 1. Direct answer from answer object - highest priority with type safety
            const directAnswer = answer && (
                hasValue(answer.userAnswer) ? answer.userAnswer :
                hasValue(answer.code) ? answer.code :
                hasValue(answer.answer) ? answer.answer :
                hasValue(answer.text) ? answer.text : null
            );
            
            // 2. Results object answers with type safety
            const resultsAnswer = questionResult && (
                hasValue(questionResult.userAnswer) ? questionResult.userAnswer : null
            );
            
            // 3. Question object answers (sometimes stored here)
            const questionAnswer = hasValue(q.userAnswer) ? q.userAnswer :
                                hasValue(q.submittedAnswer) ? q.submittedAnswer :
                                hasValue(q.response) ? q.response : null;
                                  // 4. For conceptual questions, check specialized locations
            const conceptualAnswer = 
                (answer && hasValue(answer.conceptualAnswer) ? answer.conceptualAnswer : null) ||
                (hasValue(q.conceptualAnswer) ? q.conceptualAnswer : null) ||
                (answer && answer?.metadata && hasValue(answer?.metadata?.answer) ? answer.metadata.answer : null) ||
                (q.content && hasValue(q.content?.answer) ? q.content.answer : null);
                                  
            // 5. Check other index-based locations in arrays as last resort
            const alternateIndexAnswer = 
                (result.answers && result.answers[index] && hasValue(result.answers[index].userAnswer)) ? 
                    result.answers[index].userAnswer : 
                (result.answers && result.answers[index] && hasValue(result.answers[index].answer)) ? 
                    result.answers[index].answer : null;
                                  
            // 6. For framework-specific questions, check subject-specific fields
            const frameworkAnswer = 
                (answer && hasValue(answer.angularAnswer)) ? answer.angularAnswer : 
                hasValue(q.angularAnswer) ? q.angularAnswer : null;
            
            // Combine all sources with fallbacks - ANY non-empty value will be used
            const rawUserAnswer = directAnswer || resultsAnswer || questionAnswer || 
                                conceptualAnswer || alternateIndexAnswer || frameworkAnswer || "";
            
            // Handle different data types gracefully
            let userAnswerStr: string;
            if (typeof rawUserAnswer === 'string') {
                userAnswerStr = rawUserAnswer.trim();
            } else if (rawUserAnswer === null || rawUserAnswer === undefined) {
                userAnswerStr = "";
            } else if (typeof rawUserAnswer === 'object') {
                try {
                    userAnswerStr = JSON.stringify(rawUserAnswer, null, 2).trim();
                } catch (e) {
                    userAnswerStr = String(rawUserAnswer).trim();
                }
            } else {
                userAnswerStr = String(rawUserAnswer).trim();
            }
            
            // We consider it answered if there's ANY content after all our extraction attempts
            const userAnswer = userAnswerStr !== "" ? rawUserAnswer : null;
            
            // Extract correct answer with comprehensive fallbacks
            let correctAnswer: string;
            
            // Try getting correct answer from question first (most reliable)
            if (typeof q.correctAnswer === 'string' && q.correctAnswer.trim()) {
                correctAnswer = q.correctAnswer;
            } else if (typeof q.answer === 'string' && q.answer.trim()) {
                correctAnswer = q.answer;
            } else if (typeof q.expectedOutput === 'string' && q.expectedOutput.trim()) {
                correctAnswer = q.expectedOutput;
            }
            // Then try answer object
            else if (answer && typeof answer.correctAnswer === 'string' && answer.correctAnswer.trim()) {
                correctAnswer = answer.correctAnswer;
            }
            // Finally try questionResult object
            else if (questionResult && typeof questionResult.correctAnswer === 'string' && questionResult.correctAnswer.trim()) {
                correctAnswer = questionResult.correctAnswer;
            } else {
                correctAnswer = "";
            }
            
            // Get explanation with proper type checking
            const explanation = 
                (typeof q.explanation === 'string' && q.explanation.trim()) ? q.explanation : 
                (answer && typeof answer.explanation === 'string' && answer.explanation.trim()) ? answer.explanation : 
                (questionResult && typeof questionResult.explanation === 'string' && questionResult.explanation.trim()) ? questionResult.explanation : "";
            
            // Determine correctness with multiple fallback paths and explicit type checking
            const isCorrect = 
                (answer && answer.isCorrect === true) || 
                (questionResult && questionResult.isCorrect === true) ||
                false;
                
            const expanded = expandedQuestions.has(qid)

            return (
              <Collapsible
                key={q.id}
                open={expanded}
                onOpenChange={() => toggleQuestion(String(q.id))}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className={cn(
                    "cursor-pointer hover:bg-muted rounded-lg px-4 py-3 transition-all",
                    isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  )}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <Check className="text-green-600 w-4 h-4" />
                        ) : (
                          <X className="text-red-600 w-4 h-4" />
                        )}
                        <span className="font-medium">Question {index + 1}</span>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 bg-muted/30 rounded-lg">
                    <div>                      <span className="font-semibold">Question:</span>
                      <p className="text-muted-foreground mt-1">{questionText}</p>
                    </div>                    {codeSnippet && codeSnippet.trim() !== "" && (
                      <div>
                        <span className="font-semibold mb-2 block">Code Snippet:</span>
                        <div className="rounded-md overflow-hidden">
                          <SyntaxHighlighter
                            language={codeLanguage}
                            style={vs2015}
                            showLineNumbers
                            customStyle={{ padding: '1rem' }}
                          >
                            {codeSnippet}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    )}<div>                      <span className="font-semibold">Your Answer:</span>
                      {userAnswer === null ? (
                        <div className="mt-1 p-3 bg-background border rounded-md text-muted-foreground italic">
                          Not Answered
                        </div>
                      ) : typeof userAnswer === 'string' && userAnswer.includes('\n') ? (
                        // Multi-line code answer with syntax highlighting
                        <div className="mt-1 rounded-md overflow-hidden">
                          <SyntaxHighlighter
                            language={codeLanguage}
                            style={vs2015}
                            showLineNumbers
                          >
                            {userAnswer}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        // Single-line answer or non-code answer
                        <div className="mt-1 p-3 bg-background border rounded-md whitespace-pre-wrap font-mono text-sm">
                          {userAnswer}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <span className="font-semibold">Correct Answer:</span>
                      {!correctAnswer ? (
                        <div className="mt-1 p-3 bg-background border rounded-md text-muted-foreground italic">
                          Unavailable
                        </div>
                      ) : typeof correctAnswer === 'string' && correctAnswer.includes('\n') ? (
                        // Multi-line code answer with syntax highlighting
                        <div className="mt-1 rounded-md overflow-hidden">
                          <SyntaxHighlighter
                            language={codeLanguage}
                            style={vs2015}
                            showLineNumbers
                          >
                            {correctAnswer}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        // Single-line answer
                        <div className="mt-1 p-3 bg-background border rounded-md whitespace-pre-wrap font-mono text-sm">
                          {correctAnswer}
                        </div>
                      )}
                    </div>

                    {explanation && (
                      <div>
                        <span className="font-semibold">Explanation:</span>
                        <div className="mt-1 p-3 bg-background/60 border rounded-md whitespace-pre-wrap">
                          {explanation}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
