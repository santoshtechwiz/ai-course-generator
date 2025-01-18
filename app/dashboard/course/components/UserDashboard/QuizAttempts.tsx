import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrismaQuizAttempt } from "@/app/types";

interface QuizAttemptsProps {
  quizAttempts: PrismaQuizAttempt[];
}

export function QuizAttempts({ quizAttempts }: QuizAttemptsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Quiz Attempts</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {quizAttempts?.map((attempt) => (
            <li key={attempt.id} className="border-b pb-4 last:border-b-0">
              <h4 className="font-semibold">Quiz ID: {attempt.quizId}</h4>
              <p>Score: {attempt.score}</p>
              <p>Accuracy: {(attempt.accuracy || 0).toFixed(2)}%</p>
              <p>Time Spent: {attempt.timeSpent} seconds</p>
              <p>Improvement: {attempt.improvement ? `${attempt.improvement.toFixed(2)}%` : 'N/A'}</p>
              <details>
                <summary className="cursor-pointer text-sm text-blue-600">View Questions</summary>
                <ul className="mt-2 space-y-2">
                  {attempt.QuizAttemptQuestion.map((question) => (
                    <li key={question.id} className="text-sm">
                      <p>Question ID: {question.questionId}</p>
                      <p>User Answer: {question.userAnswer}</p>
                      <p>Correct: {question.isCorrect ? 'Yes' : 'No'}</p>
                      <p>Time Spent: {question.timeSpent} seconds</p>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

