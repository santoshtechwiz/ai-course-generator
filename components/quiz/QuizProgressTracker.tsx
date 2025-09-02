'use client';

import useProgressTracker from '@/hooks/use-progress-tracker';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface QuizProgressTrackerProps {
  userId: string;
  courseId: number;
  chapterId: number;
  quizId: number;
  onProgressUpdate?: (progress: number) => void;
  onCompletion?: (score: number) => void;
  minimumPassingScore?: number;
}

interface QuizAttempt {
  score: number;
  accuracy: number;
  timeSpent: number;
  answers: Record<string, any>;
  startTime: number;
}

export function QuizProgressTracker({
  userId,
  courseId,
  chapterId,
  quizId,
  onProgressUpdate,
  onCompletion,
  minimumPassingScore = 70
}: QuizProgressTrackerProps) {
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updateProgress } = useProgressTracker({
    userId,
    courseId,
    chapterId,
    onError: (error) => {
      toast.error('Failed to save quiz progress. Please try again.');
      console.error('Failed to update quiz progress:', error);
    },
  });

  const startQuiz = useCallback(() => {
    setCurrentAttempt({
      score: 0,
      accuracy: 0,
      timeSpent: 0,
      answers: {},
      startTime: Date.now()
    });
  }, []);

  const updateAnswer = useCallback((questionId: string, answer: any) => {
    setCurrentAttempt(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: answer
        }
      };
    });
  }, []);

  const calculateProgress = useCallback((totalQuestions: number) => {
    if (!currentAttempt) return 0;
    const answeredQuestions = Object.keys(currentAttempt.answers).length;
    const progress = (answeredQuestions / totalQuestions) * 100;
    onProgressUpdate?.(progress);
    return progress;
  }, [currentAttempt, onProgressUpdate]);

  const submitQuizAttempt = useCallback(
    async (answers: Record<string, any>, totalQuestions: number) => {
      if (!currentAttempt || isSubmitting) return;

      try {
        setIsSubmitting(true);

        const timeSpent = Math.floor((Date.now() - currentAttempt.startTime) / 1000);
        const correctAnswers = Object.values(answers).filter(Boolean).length;
        const score = (correctAnswers / totalQuestions) * 100;
        const accuracy = (correctAnswers / Object.keys(answers).length) * 100;

        // Update progress
        updateProgress(score, 'quiz', {
          quizId,
          score,
          accuracy,
          timeSpent,
          answers,
          completed: true,
          passed: score >= minimumPassingScore
        });

        // Call completion callback
        if (score >= minimumPassingScore) {
          onCompletion?.(score);
        }

        // Show success message
        toast.success(
          score >= minimumPassingScore 
            ? `Quiz completed! Score: ${Math.round(score)}%` 
            : `Quiz completed. You need ${minimumPassingScore}% to pass. Try again!`
        );

        // Reset current attempt
        setCurrentAttempt(null);
      } catch (error) {
        console.error('Error submitting quiz:', error);
        toast.error('Failed to submit quiz. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentAttempt, isSubmitting, minimumPassingScore, onCompletion, quizId, updateProgress]
  );

  return {
    startQuiz,
    updateAnswer,
    submitQuizAttempt,
    calculateProgress,
    isSubmitting,
    currentAttempt
  };
}
