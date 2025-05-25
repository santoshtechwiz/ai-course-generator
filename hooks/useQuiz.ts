import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { AppDispatch } from '@/store';
import {
  fetchQuiz,
  saveAnswer,
  submitQuiz,
  setCurrentQuestionIndex,
  resetQuiz,
  selectQuizId,
  selectQuizType,
  selectCurrentQuestion,
  selectCurrentQuestionIndex,
  selectQuestions,
  selectQuizStatus,
  selectQuizError,
  selectIsQuizComplete,
  selectQuizResults,
  selectQuizProgress,
  selectAnswers
} from '@/store/slices/quizSlice';
import { setLoading, addToast } from '@/store/slices/uiSlice';
import { Answer } from '@/types/quiz';

export function useQuiz(quizId?: string, quizType?: string) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  // Selectors
  const storedQuizId = useSelector(selectQuizId);
  const storedQuizType = useSelector(selectQuizType);
  const currentQuestion = useSelector(selectCurrentQuestion);
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex);
  const questions = useSelector(selectQuestions);
  const status = useSelector(selectQuizStatus);
  const error = useSelector(selectQuizError);
  const isComplete = useSelector(selectIsQuizComplete);
  const results = useSelector(selectQuizResults);
  const progress = useSelector(selectQuizProgress);
  const answers = useSelector(selectAnswers);
  
  // Derived state
  const isLoading = status === 'loading';
  const isSubmitting = status === 'submitting';
  const hasError = status === 'error';
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  // Initialize quiz
  const initializeQuiz = useCallback(async (id: string, type: string, data?: any) => {
    try {
      dispatch(setLoading({ isLoading: true, message: 'Loading quiz...' }));
      await dispatch(fetchQuiz({ id, type, data })).unwrap();
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        message: error.message || 'Failed to load quiz',
        duration: 5000,
      }));
    } finally {
      dispatch(setLoading({ isLoading: false }));
    }
  }, [dispatch]);
  
  // Handle answer submission
  const handleAnswer = useCallback(async (questionId: string, answerData: any) => {
    try {
      await dispatch(saveAnswer({ questionId, answer: answerData })).unwrap();
      
      if (isLastQuestion) {
        // If last question, prepare for submission
        return true;
      } else {
        // Move to next question
        dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1));
        return false;
      }
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to save your answer. Please try again.',
        duration: 5000,
      }));
      return false;
    }
  }, [dispatch, currentQuestionIndex, isLastQuestion]);
  
  // Handle quiz submission
  const handleSubmit = useCallback(async (slug: string, quizId: string, type: string, timeTaken?: number) => {
    try {
      dispatch(setLoading({ isLoading: true, message: 'Submitting quiz...' }));
      const result = await dispatch(submitQuiz({ slug, quizId, type, timeTaken })).unwrap();
      
      dispatch(addToast({
        type: 'success',
        message: 'Quiz submitted successfully!',
        duration: 3000,
      }));
      
      return result;
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        message: error.message || 'Failed to submit quiz',
        duration: 5000,
      }));
      return null;
    } finally {
      dispatch(setLoading({ isLoading: false }));
    }
  }, [dispatch]);
  
  // Reset quiz
  const resetQuizState = useCallback(() => {
    dispatch(resetQuiz());
  }, [dispatch]);
  
  // Initialize quiz if ID is provided
  useEffect(() => {
    if (quizId && quizType && (!storedQuizId || storedQuizId !== quizId)) {
      initializeQuiz(quizId, quizType);
    }
  }, [quizId, quizType, storedQuizId, initializeQuiz]);
  
  return {
    // State
    currentQuestion,
    currentQuestionIndex,
    questions,
    answers,
    isLoading,
    isSubmitting,
    hasError,
    error,
    isComplete,
    results,
    progress,
    isLastQuestion,
    
    // Actions
    initializeQuiz,
    handleAnswer,
    handleSubmit,
    resetQuizState,
    
    // Navigation helpers
    goToQuestion: (index: number) => dispatch(setCurrentQuestionIndex(index)),
    goToNextQuestion: () => dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1)),
    goToPreviousQuestion: () => dispatch(setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))),
  };
}
