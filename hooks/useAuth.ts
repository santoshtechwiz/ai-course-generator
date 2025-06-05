import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useSession } from "next-auth/react";
import {
  selectAuth,
  selectIsAuthenticated,
  selectUser,
  selectToken,
  selectIsAdmin,
  selectAuthStatus,
  selectIsAuthLoading,
  initializeAuth,
  loginSuccess,
  loginFailure,
  logout as logoutAction,
  setUser,
  AuthUser
} from "@/store/slices/authSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const token = useAppSelector(selectToken);
  const isAdmin = useAppSelector(selectIsAdmin);
  const status = useAppSelector(selectAuthStatus);
  const isLoading = useAppSelector(selectIsAuthLoading);

  // Use next-auth session directly
  const { data: session, status: sessionStatus } = useSession();
  // Update Redux state when session changes
  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      // Ensure we have all the user data we need
      dispatch(loginSuccess({ 
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          isAdmin: session.user.isAdmin || false,
          credits: session.user.credits || 0,
          userType: session.user.userType || 'FREE'
        },
        token: session.user.accessToken || null
      }));
    } else if (sessionStatus === "unauthenticated") {
      dispatch(logoutAction());
    }
  }, [session, sessionStatus, dispatch]);

  // Wrap next-auth signIn function to update Redux state
  const signIn = useCallback(async (provider?: string, options?: any): Promise<any> => {
    try {
      dispatch(logoutAction()) // Clear previous state
      const result: any = await signIn(provider, options)
      
      // If signIn was successful and we have the response,
      // we'll wait for the session to be updated and Redux will get that
      // via initializeAuth or the auth provider
      
      return result
    } catch (error) {
      console.error("Sign in error:", error)
      dispatch(loginFailure(error instanceof Error ? error.message : "Sign in failed"))
      return null
    }
  }, [dispatch])

  // Wrap next-auth signOut function to update Redux state
  const signOut = useCallback(async (options?: any) => {
    try {
      await signOut(options)
      dispatch(logoutAction())
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }, [dispatch])

  // Update user in Redux store
  const updateUser = useCallback((user: AuthUser | null) => {
    dispatch(setUser(user))
  }, [dispatch])

  return {
    user,
    token,
    isAdmin,
    isAuthenticated,
    status,
    isLoading,
    signIn,
    signOut,
    updateUser,
    error: auth.error,
    isInitialized: auth.isInitialized,
  };
}

// Temporarily provide adapter functions for existing auth hooks
export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}

export function useToken() {
  const { token } = useAuth();
  return token;
}

export function useIsAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin;
}

export function useAuthStatus() {
  const { status } = useAuth();
  return status;
}

export default useAuth;
