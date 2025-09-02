'use client';

import { QuizProgressTracker } from '@/components/quiz/QuizProgressTracker';
import { useSession } from 'next-auth/react';
import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizComponentProps {
  courseId: number;
  chapterId: number;
  quizId: number;
  questions: QuizQuestion[];
  onComplete?: (passed: boolean) => void;
}

export function QuizComponent({
  courseId,
  chapterId,
  quizId,
  questions,
  onComplete
}: QuizComponentProps) {
  const { data: session } = useSession();
  const [progress, setProgress] = useState(0);

  const {
    startQuiz,
    updateAnswer,
    submitQuizAttempt,
    calculateProgress,
    isSubmitting,
    currentAttempt
  } = QuizProgressTracker({
    userId: session?.user?.id || '',
    courseId,
    chapterId,
    quizId,
    onProgressUpdate: setProgress,
    onCompletion: (score) => onComplete?.(score >= 70)
  });

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    updateAnswer(questionId, answer);
    calculateProgress(questions.length);
  }, [calculateProgress, questions.length, updateAnswer]);

  const handleSubmit = useCallback(async () => {
    if (!currentAttempt) return;
    
    const answers = currentAttempt.answers;
    const graded = questions.reduce((acc, question) => {
      acc[question.id] = answers[question.id] === question.correctAnswer;
      return acc;
    }, {} as Record<string, boolean>);

    await submitQuizAttempt(graded, questions.length);
  }, [currentAttempt, questions, submitQuizAttempt]);

  if (!currentAttempt) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-xl font-semibold mb-4">Ready to take the quiz?</h3>
        <Button onClick={startQuiz}>Start Quiz</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-1">
          Progress: {Math.round(progress)}%
        </p>
      </div>

      <div className="space-y-8">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-4">
            <h3 className="font-medium">
              {index + 1}. {question.question}
            </h3>
            <RadioGroup
              value={currentAttempt.answers[question.id]}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                  <Label htmlFor={`${question.id}-${optionIndex}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            Object.keys(currentAttempt.answers).length !== questions.length
          }
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>
    </Card>
  );
}
