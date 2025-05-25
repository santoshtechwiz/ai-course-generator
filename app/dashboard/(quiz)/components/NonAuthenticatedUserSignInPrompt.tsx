'use client'
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LogIn, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export interface NonAuthenticatedUserSignInPromptProps {
  quizType: "mcq" | "code" | "blanks" | "openended" | "quiz";
  message?: string;
  previewData?: {
    score?: number;
    maxScore?: number;
    percentage?: number;
  };
  showSaveMessage?: boolean;
  returnPath?: string;
  onSignIn?: () => void;
}

export default function NonAuthenticatedUserSignInPrompt({
  quizType,
  message = "Sign in to save your progress and continue",
  previewData,
  showSaveMessage = false,
  returnPath,
  onSignIn
}: NonAuthenticatedUserSignInPromptProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
      return;
    }
    
    // Use default sign in behavior if no custom handler
    setIsLoading(true);
    const callbackUrl = returnPath || window.location.pathname;
    signIn(undefined, { callbackUrl });
  };

  const quizTypeName = 
    quizType === "mcq" ? "Multiple Choice" :
    quizType === "code" ? "Code Challenge" :
    quizType === "blanks" ? "Fill in the Blanks" :
    quizType === "openended" ? "Open Ended" : "Quiz";

  return (
    <Card className="max-w-md mx-auto shadow-lg border-t-4 border-primary">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          {/* <QuizTypeIcon type={quizType} className="w-5 h-5" /> */}
          <CardTitle className="text-xl">{quizTypeName} Quiz</CardTitle>
        </div>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showSaveMessage && (
          <div className="flex items-center p-3 text-sm bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 rounded-md">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0" />
            <p>Sign in to save your answers and see your results.</p>
          </div>
        )}
        
        {previewData && (
          <div className="space-y-3 bg-muted/40 p-4 rounded-md border">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Your score</span>
                <span className="font-medium">
                  {previewData.score}/{previewData.maxScore}
                </span>
              </div>
              
              <Progress 
                value={previewData.percentage} 
                className="h-2" 
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {previewData.percentage !== undefined && previewData.percentage < 40 && (
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      Needs improvement
                    </span>
                  )}
                  {previewData.percentage !== undefined && previewData.percentage >= 40 && previewData.percentage < 70 && (
                    <span>Good effort</span>
                  )}
                  {previewData.percentage !== undefined && previewData.percentage >= 70 && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      Well done!
                    </span>
                  )}
                </span>
                <span className="font-medium">{previewData.percentage}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In to Continue
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
