import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loginSuccess,
  loginFailure,
  logout as reduxLogout,
  selectAuth,
  selectIsAuthenticated,
  selectIsAuthLoading,
} from "@/store/slices/auth-slice";
import { signIn, signOut } from "next-auth/react";
import { resetSubscriptionState } from "@/store/slices/subscription-slice";

/**
 * useOptimizedAuth: Unified hook for auth state (Redux + next-auth sync)
 * - Redux is the single source of truth for client auth state
 * - Hydrates Redux from next-auth session on mount/session change
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const reduxAuth = useAppSelector(selectAuth);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsAuthLoading);
  const { data: session, status } = useSession();

  // Hydrate Redux from next-auth session if needed
  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated" && session?.user) {
      dispatch(
        loginSuccess({
          user: session.user,
          token: session.user.accessToken || null,
        })
      );
    } else if (status === "unauthenticated") {
      dispatch(reduxLogout());
    }
  }, [status, session, dispatch]);

  // Prefer Redux state, fallback to next-auth session if needed
  const user = reduxAuth?.user || session?.user || null;
  const token = reduxAuth?.token || session?.user?.accessToken || null;
  const unifiedStatus =
    reduxAuth?.status === "authenticated"
      ? "authenticated"
      : status === "loading"
      ? "loading"
      : "unauthenticated";

  // Unified login/logout logic (no context fallback)
  const login = async (provider: string, options?: { callbackUrl?: string }) => {
    await signIn(provider, { callbackUrl: options?.callbackUrl || "/dashboard" });
  };
  const logout = async (options: { redirect?: boolean; callbackUrl?: string } = {}) => {
    // Clear Redux and subscription state
    dispatch(reduxLogout());
    dispatch(resetSubscriptionState());
    // Clear local/session storage for all auth/session keys
    if (typeof window !== "undefined") {
      const itemsToClear = [
        ["localStorage", "redux_state"],
        ["localStorage", "persist:auth"],
        ["localStorage", "persist:course"],
        ["localStorage", "pendingQuizResults"],
        ["sessionStorage", "redux_state"],
        ["sessionStorage", "pendingQuizResults"],
        ["sessionStorage", "guestId"],
        ["sessionStorage", "next-auth.session-token"],
        ["sessionStorage", "next-auth.callback-url"],
        ["sessionStorage", "next-auth.csrf-token"],
      ];
      itemsToClear.forEach(([storageType, key]) => {
        try {
          window[storageType as "localStorage" | "sessionStorage"]?.removeItem(key);
        } catch (e) {}
      });
    }
    // Call next-auth signOut
    await signOut({ redirect: options.redirect ?? true, callbackUrl: options.callbackUrl || "/" });
  };

  return {
    user,
    token,
    status: unifiedStatus,
    isAuthenticated,
    isLoading,
    session,
    login,
    logout,
  };
}

export default useAuth;
