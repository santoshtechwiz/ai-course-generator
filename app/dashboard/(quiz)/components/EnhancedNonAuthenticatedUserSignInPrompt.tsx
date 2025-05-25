"use client"

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/hooks/spinner";
import { selectAuthStatus, selectIsAuthenticated } from "@/store/slices/authSlice";
import React, { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuizResultPreviewItem {
  id: string | number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface QuizResultPreview {
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  questions: QuizResultPreviewItem[];
  slug?: string;
}

interface AuthPromptProps {
  onSignIn: () => void;
  title?: string;
  message?: string;
  quizType: 'mcq' | 'blanks' | 'openended' | 'code' | 'flashcard';
  showSaveMessage?: boolean;
  previewData?: QuizResultPreview;
}

export default function NonAuthenticatedUserSignInPrompt({
  onSignIn,
  title = "Sign In Required",
  message = "Please sign in to view and save your quiz results",
  quizType,
  showSaveMessage = true,
  previewData
}: AuthPromptProps) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authStatus = useSelector(selectAuthStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("signin");

  // Handle sign in click
  const handleSignIn = () => {
    setIsLoading(true);
    onSignIn();
  };

  // Reset loading state if auth status changes
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        {previewData && (
          <CardDescription>
            You scored {previewData.score} out of {previewData.maxScore} ({previewData.percentage}%)
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {previewData ? (
          <Tabs defaultValue="signin" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="preview">Results Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-muted-foreground">{message}</p>
              </div>
              <Button 
                onClick={handleSignIn} 
                disabled={isLoading || authStatus === 'loading'}
                className="w-full"
                size="lg"
              >
                {isLoading || authStatus === 'loading' ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In to Save Results"
                )}
              </Button>
              {showSaveMessage && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Your progress will be saved once you sign in.
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              <div className="rounded-md border p-4">
                <h3 className="font-medium mb-2">Quiz Summary</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Score: </span>
                    <span className="font-medium">{previewData.score}/{previewData.maxScore}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Percentage: </span>
                    <span className="font-medium">{previewData.percentage}%</span>
                  </div>
                </div>
                
                <h3 className="font-medium mb-2">Question Summary</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {previewData.questions.slice(0, 3).map((q, i) => (
                    <div key={i} className="text-sm border-b pb-2">
                      <p className="font-medium mb-1">{q.question}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Your answer: </span>
                          <span className={q.isCorrect ? "text-green-600" : "text-red-600"}>
                            {q.userAnswer || "Not answered"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Correct answer: </span>
                          <span className="text-green-600">{q.correctAnswer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {previewData.questions.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center italic">
                      Sign in to view all {previewData.questions.length} questions
                    </p>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleSignIn} 
                disabled={isLoading || authStatus === 'loading'}
                className="w-full"
                size="lg"
              >
                {isLoading || authStatus === 'loading' ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In to Save Full Results"
                )}
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">{message}</p>
            </div>
            <Button 
              onClick={handleSignIn} 
              disabled={isLoading || authStatus === 'loading'}
              className="w-full"
              size="lg"
            >
              {isLoading || authStatus === 'loading' ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  <span>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            {showSaveMessage && (
              <p className="text-sm text-muted-foreground text-center">
                Your progress will be saved once you sign in.
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-muted-foreground">
        <p>This helps us track your progress and save your results.</p>
      </CardFooter>
    </Card>
  );
}
