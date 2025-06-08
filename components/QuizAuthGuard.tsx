import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  selectQuizId,
  selectQuizError,
  selectQuizStatus,
  selectIsQuizComplete,
  selectQuizResults,
} from "@/store/slices/quizSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSessionService } from "@/hooks/useSessionService";
import { isReturningFromAuth } from "@/store/utils/authUtils";

interface QuizAuthGuardProps {
  quizId: string;
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function QuizAuthGuard({
  quizId,
  children,
  requireAuth = false,
}: QuizAuthGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const { saveAuthRedirectState } = useSessionService();

  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  const isCompleted = useSelector(selectIsQuizComplete);
  const quizResults = useSelector(selectQuizResults);
  const quizStatus = useSelector(selectQuizStatus);
  const error = useSelector(selectQuizError);

  const isAuthenticated = authStatus === "authenticated";
  const isAuthLoading = authStatus === "loading";
  const returning = isReturningFromAuth(searchParams);

  // Handle authentication flow
  useEffect(() => {
    // Skip if we're already processing auth or no auth is required
    if (isProcessingAuth || !requireAuth) return;

    // If user is not authenticated and auth is required
    if (!isAuthLoading && !isAuthenticated && requireAuth) {
      setIsProcessingAuth(true);

      // Save current state for restoration after auth
      saveAuthRedirectState({
        returnPath: window.location.pathname,
        slug: quizId,
        quizState: {
          slug: quizId,
          currentState: {
            // Include relevant quiz state here
            isCompleted,
            showResults: !!quizResults,
            results: quizResults,
          },
        },
      });

      // Redirect to sign in with callback to current URL
      const currentPath = window.location.pathname;
      const encodedPath = encodeURIComponent(currentPath);
      router.push(`/auth/signin?callbackUrl=${encodedPath}`);
      return;
    }

    // Reset processing flag when auth status changes
    setIsProcessingAuth(false);
  }, [
    isAuthenticated,
    isAuthLoading,
    requireAuth,
    isProcessingAuth,
    saveAuthRedirectState,
    quizId,
    router,
    isCompleted,
    quizResults,
  ]);

  // Show loading state if auth is being checked
  if (requireAuth && isAuthLoading) {
    return null; // Return nothing to avoid flickering
  }

  // If we have an error that's not auth related
  if (error && quizStatus === "failed" && !isAuthLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/dashboard/quizzes")}>
            Back to Quizzes
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If all checks pass, render children
  return children;
}
