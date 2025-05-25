"use client"

import { useState } from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"

interface BlankQuizResultsProps {
  result: {
    score: number;
    maxScore: number;
    totalQuestions: number;
    correctAnswers: number;
    completedAt: string;
    title: string;
    slug: string;
    quizId: string | number;
  };
}

export function BlankQuizResults({ result }: BlankQuizResultsProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate percentage score
  const percentage = Math.round((result.score / result.maxScore) * 100);
  
  // Format completion date
  const formattedDate = new Date(result.completedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Determine result message based on score
  const getResultMessage = () => {
    if (percentage >= 90) return "Excellent! You've mastered this topic.";
    if (percentage >= 70) return "Great job! You have a good understanding of the material.";
    if (percentage >= 50) return "Good effort! You're on the right track.";
    return "Keep practicing! You'll improve with more study.";
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{result.title} - Results</h1>
        <p className="text-muted-foreground">Completed on {formattedDate}</p>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted pb-2">
          <h2 className="text-xl font-semibold">Your Score</h2>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="10"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                />
                <circle
                  className="text-primary stroke-current"
                  strokeWidth="10"
                  strokeLinecap="round"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  strokeDasharray={`${percentage * 2.51} 251`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-3xl font-bold">{percentage}%</div>
                <div className="text-sm text-muted-foreground">
                  {result.score}/{result.maxScore}
                </div>
              </div>
            </div>
            
            <p className="text-center font-medium">{getResultMessage()}</p>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4 text-center">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{result.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Total Questions</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{result.correctAnswers}</div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t p-4">
          <Button 
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </CardFooter>
      </Card>
      
      {showDetails && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-xl font-semibold">Detailed Results</h2>
          </CardHeader>
          
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Detailed question-by-question results will be available here.
            </p>
            
            <div className="space-y-4">
              {/* This would be populated with actual question results */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">Question 1</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Kubernetes is an open-source container <span className="font-medium">orchestration</span> system.
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">Question 2</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      In Kubernetes, a <span className="font-medium">pod</span> is a group of one or more containers, with shared storage/network, and a specification for how to run the containers.
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">Question 3</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Kubernetes uses a <span className="font-medium text-red-500">imperative</span> model that defines the desired state of the application infrastructure and the application itself.
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Correct answer: declarative
                    </p>
                  </div>
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={() => window.location.href = `/dashboard/blanks/${result.slug}`}>
          Retake Quiz
        </Button>
        <Button onClick={() => window.location.href = "/dashboard/quizzes"}>
          Back to Quizzes
        </Button>
      </div>
    </div>
  );
}
