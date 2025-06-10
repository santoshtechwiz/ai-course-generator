import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { normalizeQuizIdentifier } from '@/lib/quiz-identifiers';
import { useSession } from 'next-auth/react';
import {
  fetchQuiz,
  setQuiz,
  saveAnswer,
  setQuizResults,
  selectQuizState,
  persistQuizState
} from '@/store/slices/quizSlice';

export function useQuizState(quizIdentifier?: string | { slug: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const quizState = useSelector(selectQuizState);
  const { data: session, status: authStatus } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Normalize the quiz identifier
  const normalizedIdentifier = quizIdentifier ? 
    normalizeQuizIdentifier(quizIdentifier) : null;
  
  // Load quiz data
  const loadQuiz = useCallback(async () => {
    if (!normalizedIdentifier) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await dispatch(fetchQuiz({ 
        slug: normalizedIdentifier.slug,
        type: (normalizedIdentifier.type || 'mcq') as any
      })).unwrap();
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  }, [normalizedIdentifier, dispatch]);
  
  // Submit answer with proper error handling and state updates
  const submitAnswer = useCallback((questionId: string, answer: any) => {
    try {
      dispatch(saveAnswer({ questionId, answer }));
      return true;
    } catch (error) {
      console.error('Failed to save answer:', error);
      return false;
    }
  }, [dispatch]);
  
  // Complete quiz and store results
  const completeQuiz = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Generate quiz results
      const results = {
        slug: normalizedIdentifier?.slug || quizState.slug,
        title: quizState.title,
        score: calculateScore(quizState.questions, quizState.answers),
        maxScore: quizState.questions.length,
        percentage: calculatePercentage(quizState.questions, quizState.answers),
        completedAt: new Date().toISOString(),
        questions: quizState.questions,
        answers: quizState.answers
      };
      
      if (authStatus === 'authenticated') {
        // For authenticated users, save to database and persist locally
        await dispatch(persistQuizState({
          stateType: 'results',
          data: results,
          useLocalStorage: true
        }));
      } else {
        // For unauthenticated users, just persist locally
        await dispatch(persistQuizState({
          stateType: 'results',
          data: results,
          useLocalStorage: false
        }));
      }
      
      return results;
    } catch (error) {
      console.error('Error completing quiz:', error);
      setError('Failed to complete quiz');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, quizState, authStatus, normalizedIdentifier]);
  
  // Load initial quiz data when component mounts
  useEffect(() => {
    // Only load quiz if auth status is determined and we have an identifier
    if (authStatus !== 'loading' && normalizedIdentifier) {
      loadQuiz();
    }
  }, [loadQuiz, authStatus, normalizedIdentifier]);
  
  return {
    // Quiz data
    quizId: quizState.quizId,
    slug: quizState.slug,
    title: quizState.title,
    questions: quizState.questions,
    currentQuestionIndex: quizState.currentQuestionIndex,
    answers: quizState.answers,
    results: quizState.results,
    
    // Status flags
    isLoading,
    isCompleted: quizState.isCompleted,
    error,
    isAuthenticated: authStatus === 'authenticated',
    
    // Actions
    loadQuiz,
    submitAnswer,
    completeQuiz,
  };
}

// Helper functions
function calculateScore(questions: any[], answers: Record<string, any>): number {
  return questions.reduce((score, question) => {
    const answer = answers[question.id];
    return score + (answer?.isCorrect ? 1 : 0);
  }, 0);
}

function calculatePercentage(questions: any[], answers: Record<string, any>): number {
  const score = calculateScore(questions, answers);
  return Math.round((score / Math.max(1, questions.length)) * 100);
}
