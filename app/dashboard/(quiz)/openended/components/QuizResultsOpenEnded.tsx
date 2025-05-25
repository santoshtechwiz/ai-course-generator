"use client"

import { useState, useMemo } from "react"
import { useSelector } from "react-redux"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { selectQuizResults, selectQuestions, selectAnswers, selectQuizTitle } from "@/store/slices/quizSlice"
import { OpenEndedQuizQuestion, QuizResult } from "@/app/types/quiz-types"


interface OpenEndedQuizResultsProps {
  result?: QuizResult;
  onRetake?: () => void;
}

const getUserAnswer = (answer: any): string => {
  if (!answer) return "No response provided";
  if (answer.type === "openended" && typeof answer.text === "string") return answer.text;
  if (typeof answer.userAnswer === "string") return answer.userAnswer;
  if (typeof answer.answer === "string") return answer.answer;
  return "No response provided"
}

const getModelAnswer = (answer: any, question: any): string => {
  return (
    answer?.modelAnswer ||
    question?.modelAnswer ||
    question?.answer ||
    "No model answer"
  )
}

const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return "text-green-600"
  if (percentage >= 70) return "text-blue-600"
  if (percentage >= 50) return "text-yellow-600"
  return "text-red-600"
}

const getFeedback = (percentage: number) => {
  if (percentage >= 90) return "Excellent! You've mastered this topic."
  if (percentage >= 70) return "Great job! You have a good understanding of the material."
  if (percentage >= 50) return "Good effort! You're on the right track."
  return "Keep practicing! Review the material and try again."
}

export default function QuizResultsOpenEnded({ result, onRetake }: OpenEndedQuizResultsProps) {
  const [showAnswers, setShowAnswers] = useState(false);

  const storeResults = useSelector(selectQuizResults);
  const questions = useSelector(selectQuestions) as OpenEndedQuizQuestion[];
  const answers = useSelector(selectAnswers);
  const title = useSelector(selectQuizTitle);

  const quizResult = result || storeResults;

  // Map answers by questionId for robust lookup
  const answerMap = useMemo(() => {
    const map: Record<string | number, any> = {};
    if (quizResult?.answers && typeof quizResult.answers === "object") {
      Object.entries(quizResult.answers).forEach(([key, val]) => {
        map[key] = val;
      });
    }
    if (Array.isArray(quizResult?.questionResults)) {
      quizResult.questionResults.forEach((res: any) => {
        map[res.questionId] = res;
      });
    }
    return map;
  }, [quizResult]);

  const score = quizResult?.score ?? quizResult?.correctAnswers ?? 0;
  const maxScore = quizResult?.maxScore ?? quizResult?.totalQuestions ?? questions.length;
  const percentage = quizResult?.percentage ?? (maxScore > 0 ? Math.round((score / maxScore) * 100) : 0);

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
        <p className="text-muted-foreground">
          Completed on {quizResult.completedAt ? new Date(quizResult.completedAt).toLocaleDateString() : "Unknown"}
        </p>
      </div>

      <Card className="bg-card shadow-md">
        <CardHeader className="text-center pb-2">
          <CardTitle>Your Score</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold mb-2">
            <span className={getScoreColor(percentage)}>{score}</span>
            <span className="text-muted-foreground mx-2">/</span>
            <span>{maxScore}</span>
          </div>
          <div className="text-xl font-medium mb-4">
            <span className={getScoreColor(percentage)}>{percentage}%</span>
          </div>
          <p className="text-muted-foreground">{getFeedback(percentage)}</p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={() => setShowAnswers((prev) => !prev)} variant="outline">
          {showAnswers ? "Hide Responses" : "Show Your Responses"}
        </Button>
      </div>

      {showAnswers && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Your Responses</h2>
          {questions.map((question, index) => {
            const answer = answerMap[question.id];
            const userAnswer = getUserAnswer(answer);
            const modelAnswer = getModelAnswer(answer, question);

            return (
              <Card key={question.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <p className="font-medium mb-2">Question {index + 1}:</p>
                  <p className="mb-4">{question.question}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Response:</p>
                      <div className="p-3 bg-gray-50 rounded-md mt-2 text-left">
                        <p className="whitespace-pre-wrap">{userAnswer}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Model Answer:</p>
                      <div className="p-3 bg-gray-50 rounded-md mt-2 text-left">
                        <p className="whitespace-pre-wrap">{modelAnswer}</p>
                      </div>
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
