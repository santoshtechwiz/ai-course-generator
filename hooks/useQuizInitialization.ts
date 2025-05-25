import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  fetchQuiz,
  setQuizId,
  setQuizType,
  selectQuizStatus,
  selectQuizError,
  QuizType
} from '../store/quizSlice';

/**
 * Custom hook for initializing quiz data
 * 
 * @param quizId - The ID of the quiz to initialize
 * @param quizType - The type of quiz (mcq, code, etc.)
 * @param quizData - Optional pre-loaded quiz data
 * @param slug - Optional slug for the quiz
 * @returns Object containing quiz status and error information
 */
export const useQuizInitialization = (
  quizId: string | number,
  quizType: QuizType,
  quizData?: any,
  slug?: string
) => {
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector(selectQuizStatus);
  const error = useSelector(selectQuizError);
  
  const isLoading = status === 'loading';
  const hasError = status === 'error';

  // Initialize quiz data
  useEffect(() => {
    if (quizId) {
      console.log(`Initializing ${quizType} quiz with ID:`, quizId, slug ? `and slug: ${slug}` : '');
      dispatch(setQuizId(quizId.toString()));
      dispatch(setQuizType(quizType));
      
      // If we have the quiz data already, use it directly
      dispatch(fetchQuiz({
        id: quizId.toString(),
        data: quizData,
        type: quizType
      }));
    }
  }, [dispatch, quizData, quizId, quizType, slug]);

  // Handle retry action
  const handleRetry = useCallback((userId?: string | null, redirectPath?: string) => {
    if (!userId && redirectPath) {
      return redirectPath;
    } else {
      // Suggest page reload
      return null;
    }
  }, []);

  return {
    isLoading,
    hasError,
    error,
    status,
    handleRetry
  };
};
