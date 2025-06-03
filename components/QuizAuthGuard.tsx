import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useSessionService } from "@/hooks/useSessionService";
import {
  selectIsQuizComplete,
  selectQuizResults,
  selectQuizStatus,
  selectQuizError,
  selectQuizId,
} from "@/store/slices/quizSlice";
import { selectIsAuthenticated } from "@/store/slices/authSlice";

/**
 * Centralized auth guard for quiz results.
 * - Checks authentication and quiz completion.
 * - Redirects to login if unauthenticated.
 * - Restricts access if quiz is not completed or results unavailable.
 * - Works for all quiz types.
 */
export interface QuizAuthGuardProps {
  children: React.ReactNode;
  // Optionally override the quizId/slug (otherwise uses quizSlice)
  quizId?: string;
  // Optionally override the redirect path (default: /auth/signin)
  loginRedirectPath?: string;
  // Optionally show a custom denied message
  deniedMessage?: React.ReactNode;
}

export const QuizAuthGuard: React.FC<QuizAuthGuardProps> = ({
  children,
  quizId,
  loginRedirectPath = "/auth/signin",
  deniedMessage = "You are not authorized to view these quiz results.",
}) => {
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isQuizComplete = useSelector(selectIsQuizComplete);
  const quizResults = useSelector(selectQuizResults);
  const quizStatus = useSelector(selectQuizStatus);
  const quizError = useSelector(selectQuizError);
  const quizSlug = useSelector(selectQuizId);
  const { saveAuthRedirectState } = useSessionService();

  // Determine if user can view results
  const canViewResults = useMemo(() => {
    // Must be authenticated and quiz must be completed and results available
    return (
      isAuthenticated &&
      isQuizComplete &&
      !!quizResults &&
      !quizError &&
      quizStatus !== "failed"
    );
  }, [isAuthenticated, isQuizComplete, quizResults, quizError, quizStatus]);

  // If not authenticated, redirect to login and save intended state
  useEffect(() => {
    if (isAuthenticated === false) {
      // Save intended state for redirect after login
      saveAuthRedirectState({
        returnPath: typeof window !== "undefined" ? window.location.pathname : "",
        quizState: {
          slug: quizId || quizSlug,
          // Optionally add more quiz state if needed
        },
      });
      router.replace(loginRedirectPath);
    }
  }, [isAuthenticated, router, loginRedirectPath, saveAuthRedirectState, quizId, quizSlug]);

  // If authenticated but not allowed to view results, show denied
  if (isAuthenticated && !canViewResults) {
    return (
      <div>
        {deniedMessage}
        {quizError && (
          <div style={{ color: "red", marginTop: 8 }}>{quizError}</div>
        )}
      </div>
    );
  }

  // If loading or checking auth, don't render children yet
  if (isAuthenticated === false || !canViewResults) {
    return null;
  }

  // Authorized: render children
  return <>{children}</>;
};

export default QuizAuthGuard;

// No changes needed in this file for the reported error.
// The error is in ./store/slices/quizSlice.ts, not in QuizAuthGuard.ts.
