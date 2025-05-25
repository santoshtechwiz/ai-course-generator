"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { selectQuizResults, selectQuestions, selectAnswers,
   selectQuizTitle } from "@/store/slices/quizSlice"
import { QuizResult, BlankQuizQuestion } from "@/app/types/quiz-types"


interface BlankQuizResultsProps {
  result: QuizResult;
  onRetake?: () => void;
}

export function BlankQuizResults({ result, onRetake }: BlankQuizResultsProps) {
  const [showAnswers, setShowAnswers] = useState(false);
  
  // Redux selectors
  const storeResults = useSelector(selectQuizResults);
  const questions = useSelector(selectQuestions) as BlankQuizQuestion[];
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
  
  const { score, maxScore, percentage } = quizResult;
  
  // Get feedback based on score
  const getFeedback = () => {
    if (percentage >= 90) return "Excellent! You've mastered this topic.";
    if (percentage >= 70) return "Great job! You have a good understanding of the material.";
    if (percentage >= 50) return "Good effort! You're on the right track.";
    return "Keep practicing! Review the material and try again.";
  };
  
  // Get color based on score
  const getScoreColor = () => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{title || "Quiz"} Results</h1>
        <p className="text-muted-foreground">Completed on {new Date(quizResult.completedAt).toLocaleDateString()}</p>
      </div>
      
      <Card className="bg-card shadow-md">
        <CardHeader className="text-center pb-2">
          <CardTitle>Your Score</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold mb-2 flex items-center justify-center">
            <span className={getScoreColor()}>{score}</span>
            <span className="text-muted-foreground mx-2">/</span>
            <span>{maxScore}</span>
          </div>
          <div className="text-xl font-medium mb-4">
            <span className={getScoreColor()}>{percentage}%</span>
          </div>
          <p className="text-muted-foreground">{getFeedback()}</p>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button 
          onClick={() => setShowAnswers(!showAnswers)} 
          variant="outline"
          className="mb-6"
        >
          {showAnswers ? "Hide Answers" : "Show Answers"}
        </Button>
      </div>
      
      {showAnswers && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Question Details</h2>
          
          {questions.map((question, index) => {
            const answer = answers[question.id];
            const isCorrect = quizResult.questionResults?.[index]?.isCorrect;
            
            // Get the user's answer for this question
            const userAnswer = answer?.filledBlanks ? 
              Object.values(answer.filledBlanks)[0] || "No answer" : 
              "No answer";
            
            return (
              <Card key={question.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardContent className="p-4">
                  <p className="font-medium mb-2">Question {index + 1}:</p>
                  <p className="mb-4">{question.question}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Answer:</p>
                      <p className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {userAnswer}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Correct Answer:</p>
                      <p className="font-medium text-green-600">{question.answer}</p>
                    </div>
                  </div>
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
