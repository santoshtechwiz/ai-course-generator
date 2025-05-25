import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { signIn } from 'next-auth/react';
import { saveAuthRedirectState } from '../store/quizSlice';
import { AuthRedirectState } from '../types/quiz';

/**
 * Custom hook for handling authentication in quiz flows
 * 
 * @param slug - The slug of the quiz
 * @param quizId - The ID of the quiz
 * @param quizType - The type of quiz (mcq, code, etc.)
 * @returns Object containing authentication handling functions
 */
export const useQuizAuthentication = (
  slug: string,
  quizId: string | number,
  quizType: string
) => {
  const dispatch = useDispatch();

  // Handle sign-in action for non-authenticated users
  const handleShowSignIn = useCallback((authState: Partial<AuthRedirectState>) => {
    // Save quiz state to Redux before redirect
    dispatch(saveAuthRedirectState({
      slug,
      quizId: quizId.toString(),
      type: quizType,
      answers: authState.answers || {},
      currentQuestionIndex: authState.currentQuestionIndex || 0,
      tempResults: authState.tempResults || null
    }));

    // Redirect to sign-in page
    signIn(undefined, {
      callbackUrl: `/dashboard/${quizType}/${slug}?fromAuth=true`,
    });
  }, [slug, quizId, quizType, dispatch]);

  return {
    handleShowSignIn
  };
};
