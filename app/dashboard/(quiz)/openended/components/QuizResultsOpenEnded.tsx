"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { selectQuizResults, selectQuestions, selectAnswers, 
  selectQuizTitle } from "@/store/slices/quizSlice"
import { OpenEndedQuizQuestion, QuizResult } from "@/app/types/quiz-types"


interface OpenEndedQuizResultsProps {
  result: QuizResult;
  onRetake?: () => void;
}

export default function QuizResultsOpenEnded({ result, onRetake }: OpenEndedQuizResultsProps) {
  const [showAnswers, setShowAnswers] = useState(false);
  
  // Redux selectors
  const storeResults = useSelector(selectQuizResults);
  const questions = useSelector(selectQuestions) as OpenEndedQuizQuestion[];
  const answers = useSelector(selectAnswers);
  const title = useSelector(selectQuizTitle);
  
  // Use either passed result or store result
  const quizResult = result || storeResults;
  
  if (!quizResult) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-2">No Results Available</h2>
        <p className="text-gray-600">We couldn't find your quiz results.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{title || "Quiz"} Results</h1>
        <p className="text-muted-foreground">Completed on {new Date(quizResult.completedAt).toLocaleDateString()}</p>
      </div>
      
      <Card className="bg-card shadow-md">
        <CardHeader className="text-center pb-2">
          <CardTitle>Your Responses</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            You've completed all {questions.length} questions. Your responses have been recorded.
          </p>
          <div className="text-xl font-medium mb-4">
            <span className="text-green-600">Thank you for your participation!</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button 
          onClick={() => setShowAnswers(!showAnswers)} 
          variant="outline"
          className="mb-6"
        >
          {showAnswers ? "Hide Responses" : "Show Your Responses"}
        </Button>
      </div>
      
      {showAnswers && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Responses</h2>
          
          {questions.map((question, index) => {
            const answer = answers[question.id];
            
            // Get the user's answer for this question
            const userAnswer = answer?.text || "No response provided";
            
            return (
              <Card key={question.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <p className="font-medium mb-2">Question {index + 1}:</p>
                  <p className="mb-4">{question.question}</p>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Your Response:</p>
                    <div className="p-3 bg-gray-50 rounded-md mt-2 text-left">
                      <p className="whitespace-pre-wrap">{userAnswer}</p>
                    </div>
                  </div>
                  
                  {question.hints && question.hints.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Key Points:</p>
                      <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                        {question.hints.map((hint, hintIndex) => (
                          <li key={hintIndex}>{hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {onRetake && (
        <div className="text-center mt-8">
          <Button onClick={onRetake} variant="default">
            Retake Quiz
          </Button>
        </div>
      )}
    </div>
  );
}
