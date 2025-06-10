import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { QuizLoader } from '@/components/ui/quiz-loader';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectQuizState,
  setQuiz,
  saveAnswer,
  setQuizResults,
} from '@/store/slices/quizSlice';
import { QuizWrapper } from '../components/QuizWrapper';
import { quizApiClient } from '../services/quiz-api-client';
import type { QuizType } from '@/app/types/quiz-types';

export function QuizContainer() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const quizState = useAppSelector(selectQuizState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const slug = params?.slug as string;
  const type = params?.type as QuizType || 'mcq';
  
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use quizApiClient instead of direct fetch
        const quizData = await quizApiClient.getQuiz(type, slug);
        
        dispatch(setQuiz({
          quizId: slug,
          title: quizData.title || 'Untitled Quiz',
          questions: quizData.questions || [],
          type: quizData.type || type,
        }));
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    
    loadQuiz();
  }, [slug, type, dispatch]);
  
  // Handle answer submission
  const handleAnswer = async (questionId: string, answer: any) => {
    dispatch(saveAnswer({ questionId, answer }));
  };
  
  // Handle quiz submission
  const handleSubmit = async () => {
    try {
      // Use the quizApiClient for submission
      const results = await quizApiClient.submitQuizResult(slug, type)({
        answers: quizState.answers,
        questions: quizState.questions,
      });
      
      dispatch(setQuizResults(results));
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    }
  };
  
  if (loading) {
    return <QuizLoader message="Loading quiz..." />;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }
  
  return (
    <QuizWrapper
      slug={slug}
      quizType={type}
      onAnswer={handleAnswer}
      onSubmit={handleSubmit}
    >
      {/* Quiz rendering logic based on quiz type */}
      {quizState.questions.length > 0 ? (
        <div>Quiz content here</div>
      ) : (
        <div>No questions found</div>
      )}
    </QuizWrapper>
  );
}
