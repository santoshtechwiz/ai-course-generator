"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, X, RefreshCw, Home, Share2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import React, { useState, useMemo } from "react"
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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface QuizResult {
  title?: string;
  slug?: string;
  quizId?: string;
  type?: "mcq" | "code";
  completedAt?: string;
  maxScore?: number;
  score?: number;
  percentage?: number;
  questionResults?: Array<{
    questionId: string;
    isCorrect?: boolean;
    userAnswer?: string;
    selectedOptionId?: string;
  }>;
  questions?: Array<any>;
  answers?: Array<any>;
}

interface QuizResultProps {
  result: QuizResult;
  onRetake?: () => void;
  quizType: "mcq" | "code";
}

export default function QuizResult({ result, onRetake, quizType }: QuizResultProps) {
  const router = useRouter();
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // Process the result data to ensure we have proper question results
  const processedResult = useMemo(() => {
    // Safely handle null/undefined result
    if (!result) return null;

    // Create a base processed result with defaults for missing fields
    const baseResult = {
      ...result,
      title: result.title || "Quiz Results", 
      slug: result.slug || result.quizId || "",
      questions: result.questions || [],
      questionResults: result.questionResults || []
    };

    // If we have answers array but no questionResults, build questionResults from answers
    if (Array.isArray(result.answers) && (!result.questionResults || result.questionResults.length === 0)) {
      // Make sure we safely handle potentially invalid answers data
      const questionResults = result.answers
        .filter(answer => answer && answer.questionId) // Filter out null/undefined entries
        .map(answer => ({
          questionId: answer.questionId?.toString() || '',
          isCorrect: Boolean(answer.isCorrect),
          userAnswer: answer.userAnswer || answer.selectedOptionId || "Not answered"
        }))
        .filter(q => q.questionId); // Final filter for safety
      
      baseResult.questionResults = questionResults;
    }

    // Generate questions array if missing but we have questionResults
    if ((!baseResult.questions || baseResult.questions.length === 0) && 
        baseResult.questionResults && baseResult.questionResults.length > 0) {
      
      // Create minimal question objects from questionResults if needed
      baseResult.questions = baseResult.questionResults.map((qr: any, idx: number) => ({
        id: qr.questionId,
        text: `Question ${idx + 1}`,
        answer: qr.correctAnswer || "Answer unavailable"
      }));
    }
    
    return baseResult;
  }, [result]);

  // Memoize calculations to avoid recalculating on every render
  const calculatedData = useMemo(() => {
    if (!processedResult) {
      return {
        correctQuestions: [],
        incorrectQuestions: [],
        correctCount: 0,
        incorrectCount: 0,
        totalCount: 0,
        skippedCount: 0,
        percentageCorrect: 0,
        slug: ''
      };
    }
    
    // Safely handle the data
    const questionResults = Array.isArray(processedResult.questionResults) 
      ? processedResult.questionResults 
      : [];
    
    // Safety checks
    const processedResults = questionResults
      .filter(q => q && q.questionId) // Filter out null/undefined entries
      .map(q => ({
        ...q,
        isCorrect: Boolean(q.isCorrect),
        userAnswer: q.userAnswer || q.selectedOptionId || 'Not answered'
      }));
    
    const correctQuestions = processedResults.filter(q => q.isCorrect);
    const incorrectQuestions = processedResults.filter(q => !q.isCorrect && q.userAnswer && q.userAnswer !== 'Not answered');
    const correctCount = correctQuestions.length;
    const incorrectCount = incorrectQuestions.length;
    
    // Safely determine total count
    let totalCount = 0;
    if (typeof processedResult.maxScore === 'number' && !isNaN(processedResult.maxScore)) {
      totalCount = processedResult.maxScore;
    } else if (Array.isArray(processedResult.questions)) {
      totalCount = processedResult.questions.length;
    } else if (Array.isArray(processedResult.questionResults)) {
      totalCount = processedResult.questionResults.length;
    } else {
      totalCount = correctCount + incorrectCount || 1;  // Ensure non-zero
    }
    
    const skippedCount = Math.max(0, totalCount - (correctCount + incorrectCount));
    
    // Calculate percentage safely
    let percentageCorrect = 0;
    if (totalCount > 0) {
      percentageCorrect = Math.round((correctCount / totalCount) * 100);
    } else if (typeof processedResult.percentage === 'number' && !isNaN(processedResult.percentage)) {
      percentageCorrect = processedResult.percentage;
    }
    
    const slug = processedResult.slug || processedResult.quizId || '';
    
    return {
      correctQuestions,
      incorrectQuestions,
      correctCount,
      incorrectCount,
      totalCount,
      skippedCount,
      percentageCorrect,
      slug
    };
  }, [processedResult]);
  
  // Destructure the calculated data
  const {
    correctQuestions,
    incorrectQuestions,
    correctCount,
    incorrectCount,
    totalCount,
    skippedCount,
    percentageCorrect,
    slug
  } = calculatedData;
  
  // Generation functions for the score messages
  const getScoreMessage = () => {
    if (percentageCorrect >= 90) return `Outstanding! You've mastered these ${quizType === "code" ? "coding" : ""} concepts.`;
    if (percentageCorrect >= 80) return `Excellent work! You have strong ${quizType === "code" ? "coding" : ""} knowledge.`;
    if (percentageCorrect >= 70) return `Great job! Your ${quizType === "code" ? "coding" : ""} skills are solid.`;
    if (percentageCorrect >= 60) return "Good effort! Keep practicing to strengthen your skills.";
    if (percentageCorrect >= 50) return "You're making progress. More practice will help.";
    return "Keep learning! Review the concepts and try again.";
  };
  
  // Toggle a specific question's expanded state
  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Expand all questions
  const expandAllQuestions = () => {
    if (!processedResult?.questionResults) return;
    
    const expandedState: Record<string, boolean> = {};
    processedResult.questionResults.forEach(q => {
      if (q.questionId) {
        expandedState[q.questionId] = true;
      }
    });
    setExpandedQuestions(expandedState);
  };
  
  // Collapse all questions
  const collapseAllQuestions = () => {
    setExpandedQuestions({});
  };

  // Handle sharing results
  const handleShare = async () => {
    if (!processedResult) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${processedResult.title} - Quiz Results`,
          text: `I scored ${percentageCorrect}% on the ${processedResult.title} quiz!`,
          url: window.location.href
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      } else {
        toast.error("Sharing not supported on this device");
      }
    } catch (error) {
      console.error("Error sharing results:", error);
      toast.error("Failed to share results");
    }
  };

  // Handle retaking the quiz
  const handleRetake = () => {
    if (onRetake) {
      onRetake();
    } else if (slug) {
      router.push(`/dashboard/${quizType}/${slug}?reset=true`);
    }
  };

  // More flexible validation for showing results vs error states
  const hasMinimalResultData = processedResult && 
    (processedResult.questionResults?.length > 0 || 
     processedResult.questions?.length > 0 ||
     Object.keys(processedResult).length > 3);  // Has at least some data beyond minimal fields

  // Better error state when results can't be loaded
  if (!processedResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <AlertCircle className="h-12 w-12 text-warning mb-4" />
        <h2 className="text-xl font-bold mb-2">Quiz Results Not Available</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't load your quiz results. You may need to take the quiz first.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => router.push(`/dashboard/${quizType}/${slug || ''}`)}>
            Take the Quiz
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
            Browse Quizzes
          </Button>
        </div>
      </div>
    );
  }

  // Handle incomplete results data - only show this when truly incomplete
  if (!hasMinimalResultData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <AlertCircle className="h-12 w-12 text-warning mb-4" />
        <h2 className="text-xl font-bold mb-2">Incomplete Results</h2>
        <p className="text-muted-foreground mb-6">
          Some information about your quiz results is missing. You might need to retake the quiz.
        </p>
        <div className="flex gap-3">
          <Button onClick={handleRetake}>
            <RefreshCw className="w-4 h-4 mr-1" /> Retake Quiz
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
            Browse Quizzes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Score summary */}
      <Card className="border shadow-sm overflow-hidden bg-gradient-to-br from-card to-card/80">
        <CardHeader className="bg-primary/5 border-b border-border/40">
          <CardTitle className="flex justify-between items-center">
            <span className="text-2xl font-bold">{processedResult.title || "Quiz Results"}</span>
            <Badge variant={percentageCorrect >= 70 ? "success" : percentageCorrect >= 50 ? "warning" : "destructive"} className="text-base px-3 py-1">
              {percentageCorrect}% Score
            </Badge>
          </CardTitle>
          <CardDescription>
            {processedResult.completedAt && (
              <>
                Completed on {new Date(processedResult.completedAt).toLocaleDateString()} at {new Date(processedResult.completedAt).toLocaleTimeString()}
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
      
      {/* Question review section - only show if we have question results */}
      {processedResult.questionResults && processedResult.questionResults.length > 0 && (
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
            {processedResult.questionResults.map((questionResult, index) => {
              if (!questionResult.questionId) return null;
              
              // Find the corresponding question data - much more flexible now
              const questionData = processedResult.questions?.find(q => 
                q.id?.toString() === questionResult.questionId?.toString()
              ) || {
                id: questionResult.questionId,
                text: `Question ${index + 1}`,
                answer: "Answer unavailable"
              };
              
              const isExpanded = expandedQuestions[questionResult.questionId];
              const questionText = questionData.text || questionData.question || `Question ${index + 1}`;
              const userAnswer = questionResult.userAnswer || questionResult.selectedOptionId || 'Not answered';
              
              // Determine the correct answer based on quiz type
              let correctAnswer = '';
              if (quizType === "mcq") {
                const correctOption = questionData.options?.find((o: any) => o === questionData.answer);
                correctAnswer = correctOption || questionData.answer || 'Answer unavailable';
              } else {
                correctAnswer = questionData.answer || 'Answer unavailable';
              }
              
              const isCorrect = questionResult.isCorrect;
              
              return (
                <Collapsible 
                  key={questionResult.questionId} 
                  open={isExpanded}
                  onOpenChange={() => toggleQuestion(questionResult.questionId)}
                  className={`border rounded-lg overflow-hidden ${
                    isCorrect 
                      ? 'border-success/30 bg-success/5' 
                      : 'border-destructive/30 bg-destructive/5'
                  }`}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-1 ${
                        isCorrect ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-medium">Question {index + 1}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{questionText}</p>
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
                        <h4 className="font-medium mb-2">{questionText}</h4>
                        {questionData.codeSnippet && (
                          <div className="my-3 rounded-md overflow-hidden">
                            <SyntaxHighlighter
                              language={questionData.language || "javascript"}
                              style={vscDarkPlus}
                              showLineNumbers
                            >
                              {questionData.codeSnippet}
                            </SyntaxHighlighter>
                          </div>
                        )}
                        
                        {quizType === "mcq" && questionData.options && (
                          <div className="mt-3 space-y-2">
                            <p className="font-medium">Options:</p>
                            <div className="space-y-1 pl-4">
                              {questionData.options.map((option: any, idx: number) => (
                                <div key={idx} className={`flex gap-2 items-center p-2 rounded-md ${
                                  option === questionData.answer ? 'bg-success/10' : 
                                  option === questionResult.selectedOptionId && !isCorrect ? 'bg-destructive/10' : ''
                                }`}>
                                  {option === questionData.answer && <Check className="w-4 h-4 text-success" />}
                                  {option === questionResult.selectedOptionId && !isCorrect && <X className="w-4 h-4 text-destructive" />}
                                  <span>{option}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid gap-2">
                        <div className={`p-3 rounded-md ${
                          isCorrect ? 'bg-success/10 border border-success/30' : 'bg-muted border border-muted-foreground/20'
                        }`}>
                          <div className="flex items-center gap-2">
                            {isCorrect && <Check className="w-4 h-4 text-success" />}
                            <span className="font-medium">Your answer:</span>
                          </div>
                          <p className="mt-1">{userAnswer}</p>
                        </div>
                        
                        {!isCorrect && (
                          <div className="p-3 rounded-md bg-success/10 border border-success/30">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-success" />
                              <span className="font-medium">Correct answer:</span>
                            </div>
                            <p className="mt-1">{correctAnswer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
