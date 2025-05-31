"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, X, RefreshCw, Home, Download, Share2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import React, { useState } from "react"
import { useSelector } from "react-redux"
import { 
  selectOrGenerateQuizResults, 
  selectQuestions, 
  selectAnswers, 
  selectQuizTitle 
} from "@/store/slices/quizSlice"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import type { CodeQuizResult } from "./types"

interface CodeQuizResultProps {
  result?: CodeQuizResult;
  slug: string;
}

export default function CodeQuizResult({ result, slug }: CodeQuizResultProps) {
  const router = useRouter();
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  
  // Get results from Redux if not provided directly
  const reduxResults = useSelector(selectOrGenerateQuizResults);
  const questions = useSelector(selectQuestions);
  const answers = useSelector(selectAnswers);
  const quizTitle = useSelector(selectQuizTitle);
  
  // Use provided result or results from Redux
  const finalResult = result || reduxResults;
  
  if (!finalResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't load your quiz results properly. Some data might be missing.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => router.push(`/dashboard/code/${slug}`)}>
            Retake Quiz
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    )
  }

  // Categorize questions by correctness
  const correctQuestions = finalResult.questionResults?.filter(q => q.isCorrect) || [];
  const incorrectQuestions = finalResult.questionResults?.filter(q => !q.isCorrect) || [];
  
  // Calculate various statistics
  const correctCount = correctQuestions.length;
  const incorrectCount = incorrectQuestions.length;
  const totalCount = finalResult.maxScore || questions.length;
  const skippedCount = totalCount - (correctCount + incorrectCount);
  const percentageCorrect = finalResult.percentage || Math.round((correctCount / totalCount) * 100);
  
  // Generation functions for the score messages
  const getScoreMessage = () => {
    if (percentageCorrect >= 90) return "Outstanding! You've mastered these coding concepts.";
    if (percentageCorrect >= 80) return "Excellent work! You have strong coding knowledge.";
    if (percentageCorrect >= 70) return "Great job! Your coding skills are solid.";
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
    const expandedState: Record<string, boolean> = {};
    finalResult.questionResults?.forEach(q => {
      expandedState[q.questionId] = true;
    });
    setExpandedQuestions(expandedState);
  };
  
  // Collapse all questions
  const collapseAllQuestions = () => {
    setExpandedQuestions({});
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${finalResult.title} - Quiz Results`,
          text: `I scored ${percentageCorrect}% on the ${finalResult.title} quiz!`,
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
  }

  return (
    <div className="space-y-8">
      {/* Score summary */}
      <Card className="border shadow-sm overflow-hidden bg-gradient-to-br from-card to-card/80">
        <CardHeader className="bg-primary/5 border-b border-border/40">
          <CardTitle className="flex justify-between items-center">
            <span className="text-2xl font-bold">{finalResult.title || quizTitle || "Quiz Results"}</span>
            <Badge variant={percentageCorrect >= 70 ? "success" : percentageCorrect >= 50 ? "warning" : "destructive"} className="text-base px-3 py-1">
              {percentageCorrect}% Score
            </Badge>
          </CardTitle>
          <CardDescription>
            Completed on {new Date(finalResult.completedAt).toLocaleDateString()} at {new Date(finalResult.completedAt).toLocaleTimeString()}
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
              onClick={() => router.push(`/dashboard/code/${slug}?reset=true`)}
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
          {finalResult.questionResults?.map((questionResult, index) => {
            // Find the corresponding question data
            const questionData = finalResult.questions?.find(q => q.id?.toString() === questionResult.questionId?.toString()) || 
                                questions.find(q => q.id?.toString() === questionResult.questionId?.toString());
            
            if (!questionData) return null;
            
            const isExpanded = expandedQuestions[questionResult.questionId];
            const questionText = questionData.text || questionData.question || `Question ${index + 1}`;
            const userAnswer = questionResult.userAnswer || 'Not answered';
            const correctAnswer = questionData.correctOptionId || questionData.correctAnswer || questionData.answer || 'Answer unavailable';
            
            return (
              <Collapsible 
                key={questionResult.questionId} 
                open={isExpanded}
                onOpenChange={() => toggleQuestion(questionResult.questionId)}
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
                        <div className="my-3 rounded-md overflow-hidden bg-slate-900 text-slate-50 p-4 font-mono text-sm">
                          <pre>{questionData.codeSnippet}</pre>
                        </div>
                      )}
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
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}
