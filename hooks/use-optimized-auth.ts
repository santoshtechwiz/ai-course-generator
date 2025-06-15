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
import { useAuth as useAuthContext } from "@/context/auth-context";
import { signIn, signOut } from "next-auth/react";
import { resetSubscriptionState } from "@/store/slices/subscription-slice";

/**
 * useOptimizedAuth: Unified hook for auth state (Redux + next-auth fallback)
 * - Always prefer Redux state if available
 * - Hydrates Redux from next-auth session on mount/session change
 * - Maintains backward compatibility for legacy consumers
 */
export function useOptimizedAuth() {
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

  // Provide login/logout from context if available, else fallback to next-auth
  let login = async (provider: string, options?: { callbackUrl?: string }) => {
    await signIn(provider, { callbackUrl: options?.callbackUrl || "/dashboard" });
  };
  let logout = async (options: { redirect?: boolean; callbackUrl?: string } = {}) => {
    dispatch(resetSubscriptionState());
    await signOut({ redirect: options.redirect ?? true, callbackUrl: options.callbackUrl || "/" });
  };
  try {
    // If context is available, use its login/logout
    const ctx = useAuthContext();
    login = ctx.login;
    // Wrap context logout to also reset subscription state
    logout = async (options) => {
      dispatch(resetSubscriptionState());
      await ctx.logout(options);
    };
  } catch {}

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

export default useOptimizedAuth;
