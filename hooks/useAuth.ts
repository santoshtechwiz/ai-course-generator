// src/hooks/useAuth.ts
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const fromAuth = searchParams?.get("fromAuth") === "true";

  // Extract userId for convenience
  const userId = session?.user?.id;

  // Check if user is authenticated
  const isAuthenticated = status === "authenticated" && !!session?.user;

  // Function to require authentication with redirect
  const requireAuth = useCallback(
    (callbackUrl?: string) => {
      // If already authenticated, no need to sign in
      if (isAuthenticated) return true;

      // Sign in with optional callback URL
      signIn(undefined, {
        callbackUrl: callbackUrl || window.location.pathname,
      });

      return false;
    },
    [isAuthenticated]
  );

  return {
    isAuthenticated,
    user: session?.user,
    status,
    isLoading: status === "loading",
    isError: status === "unauthenticated" && !session,
    userId,
    fromAuth,
    requireAuth,
  };
}
