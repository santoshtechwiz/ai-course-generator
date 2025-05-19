import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { useSession } from 'next-auth/react';
import { initializeQuiz, submitAnswer, submitTextQuizResults } from '../store/slices/textQuizSlice';

export function useTextQuiz(type: 'blanks' | 'openended', slug: string) {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const quizState = useAppSelector(state => state.textQuiz);

  // Initialize quiz
  const initialize = useCallback((data: any) => {
    dispatch(initializeQuiz({ ...data, type, slug }));
  }, [dispatch, type, slug]);

  // Handle answer submission
  const handleAnswer = useCallback((answer: any) => {
    dispatch(submitAnswer(answer));
  }, [dispatch]);

  // Submit quiz results
  const submitQuiz = useCallback(async (answers: any[]) => {
    if (!session?.user) {
      // Save to session storage for later
      sessionStorage.setItem(`quiz_result_${slug}`, JSON.stringify({
        answers,
        type,
        completedAt: new Date().toISOString()
      }));
      return;
    }

    await dispatch(submitTextQuizResults({
      answers,
      quizId: quizState.quizData?.id,
      type,
      slug
    })).unwrap();
  }, [dispatch, session?.user, slug, type, quizState.quizData?.id]);

  // Restore state from session storage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`quiz_state_${slug}`);
      if (saved) {
        const data = JSON.parse(saved);
        dispatch(initializeQuiz(data));
      }
    } catch (e) {
      console.error('Failed to restore quiz state:', e);
    }
  }, [dispatch, slug]);

  return {
    quizState,
    initialize,
    handleAnswer,
    submitQuiz,
    isAuthenticated: !!session?.user
  };
}
