import { store } from '@/store';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { createSelector } from 'reselect';
import { fetchQuizResults, submitQuiz, fetchQuiz, saveAnswer } from '@/store/slices/quizSlice';
import { setAuthStatus, signOut } from '@/store/slices/authSlice';

/**
 * Centralized SessionManager that handles all session-related operations
 * including sign in/out, session recovery, state migration, etc.
 */
export class SessionManager {
  /**
   * Store quiz state before authentication
   */
  static storeQuizStateBeforeAuth(slug: string): void {
    try {
      const state = store.getState();
      const { questions, answers, title } = state.quiz;
      
      if (questions.length > 0 && Object.keys(answers).length > 0) {
        sessionStorage.setItem(
          "pendingQuizResults",
          JSON.stringify({
            slug,
            questions,
            answers,
            quizTitle: title,
            storedAt: Date.now(),
          })
        );
      }
    } catch (err) {
      console.error("Failed to store quiz state before auth", err);
    }
  }

  /**
   * Recover quiz state after authentication
   */
  static async recoverQuizStateAfterAuth(slug: string): Promise<boolean> {
    try {
      const storedData = sessionStorage.getItem("pendingQuizResults");
      if (!storedData) return false;
      
      const parsed = JSON.parse(storedData);
      if (parsed.slug !== slug || !parsed.questions?.length) return false;
      
      // Restore quiz state
      const { questions, answers, quizTitle } = parsed;
      
      // Use the Redux store directly
      await store.dispatch(fetchQuiz({ 
        id: slug, 
        type: 'mcq',
        data: {
          id: slug,
          title: quizTitle,
          questions
        }
      }));
      
      // Restore answers
      if (answers) {
        Object.entries(answers).forEach(([questionId, answer]) => {
          store.dispatch(saveAnswer({ questionId, answer }));
        });
      }
      
      // Generate results
      store.dispatch(submitQuiz());
      
      // Clear stored data
      sessionStorage.removeItem("pendingQuizResults");
      
      return true;
    } catch (err) {
      console.error("Failed to recover quiz state after auth", err);
      return false;
    }
  }

  /**
   * Handle sign out with proper cleanup and redirection
   */
  static async handleSignOut(router?: any): Promise<void> {
    try {
      // Set flag that we're logging out from results page if applicable
      const currentPath = window.location.pathname;
      if (currentPath.includes('/results')) {
        const slugMatch = currentPath.match(/\/mcq\/([^/]+)\/results/);
        if (slugMatch && slugMatch[1]) {
          const quizSlug = slugMatch[1];
          sessionStorage.setItem('logoutRedirectSlug', quizSlug);
        }
      }
      
      // Dispatch Redux action to clear auth state
      store.dispatch(signOut());
      
      // Perform NextAuth signout
      await nextAuthSignOut({ redirect: false });
      
      // Redirect if router is provided
      if (router) {
        if (currentPath.includes('/results')) {
          const slugMatch = currentPath.match(/\/mcq\/([^/]+)\/results/);
          if (slugMatch && slugMatch[1]) {
            router.push(`/dashboard/mcq/${slugMatch[1]}`);
          } else {
            router.push('/dashboard/quizzes');
          }
        } else {
          router.push('/dashboard/quizzes');
        }
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }

  /**
   * Track authentication state for redirection after logout
   */
  static trackAuthState(isAuthenticated: boolean): void {
    if (isAuthenticated) {
      sessionStorage.setItem("wasLoggedIn", "true");
    }
  }

  /**
   * Check if we need to redirect after logout
   */
  static checkPostLogoutRedirect(authStatus: string, router: any): boolean {
    if (authStatus === "unauthenticated") {
      const wasLoggedIn = sessionStorage.getItem("wasLoggedIn");
      const currentPath = window.location.pathname;
      
      if (wasLoggedIn === "true" && currentPath.includes('/results')) {
        sessionStorage.removeItem("wasLoggedIn");
        
        const slugMatch = currentPath.match(/\/mcq\/([^/]+)\/results/);
        if (slugMatch && slugMatch[1]) {
          router.push(`/dashboard/mcq/${slugMatch[1]}`);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if we are returning from authentication
   */
  static isReturningFromAuth(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has("auth") || document.referrer.includes("/api/auth");
  }

  /**
   * Get authentication redirect URL with callback
   */
  static getAuthRedirectUrl(slug: string, isResults: boolean = false): string {
    const path = isResults ? `/dashboard/mcq/${slug}/results` : `/dashboard/mcq/${slug}`;
    return `/api/auth/signin?callbackUrl=${encodeURIComponent(`${path}?auth=return`)}`;
  }
}
