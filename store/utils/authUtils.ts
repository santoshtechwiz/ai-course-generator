// Authentication utilities for consistent auth flow across all quiz types
import { signIn } from "next-auth/react";
import { AppDispatch } from "../index";
import { saveAuthRedirectState } from "../slices/quizSlice";

/**
 * Handles authentication redirection for quiz results
 * Ensures consistent behavior across all quiz types
 */
export const handleAuthRedirect = (
  dispatch: AppDispatch,
  params: {
    slug: string;
    quizId: string | number;
    type: 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard';
    answers: any;
    currentQuestionIndex: number;
    tempResults?: any;
  }
) => {
  // Save current quiz state to Redux
  dispatch(saveAuthRedirectState({
    slug: params.slug,
    quizId: params.quizId.toString(),
    type: params.type,
    answers: params.answers,
    currentQuestionIndex: params.currentQuestionIndex,
    tempResults: params.tempResults
  }));

  // Redirect to sign-in with appropriate callback URL
  return signIn(undefined, {
    callbackUrl: `/dashboard/${params.type}/${params.slug}?fromAuth=true`,
  });
};

/**
 * Creates a consistent callback URL for authentication
 */
export const getAuthCallbackUrl = (
  quizType: 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard',
  slug: string,
  showResults: boolean = false
) => {
  const baseUrl = `/dashboard/${quizType}/${slug}`;
  const queryParams = new URLSearchParams();
  
  queryParams.set('fromAuth', 'true');
  
  if (showResults) {
    queryParams.set('showResults', 'true');
  }
  
  return `${baseUrl}?${queryParams.toString()}`;
};

/**
 * Checks if the current session is returning from authentication
 */
export const isReturningFromAuth = (searchParams: URLSearchParams): boolean => {
  return searchParams.get('fromAuth') === 'true';
};

/**
 * Checks if results should be shown immediately after authentication
 */
export const shouldShowResults = (searchParams: URLSearchParams): boolean => {
  return searchParams.get('showResults') === 'true';
};
