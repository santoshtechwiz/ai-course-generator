"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchSubscription,
  forceSyncSubscription,
  selectSubscriptionData,
} from "@/store/slices/subscription-slice";
import { usePathname } from "next/navigation";

// Types
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  credits?: number;
  creditsUsed?: number;
  isAdmin?: boolean;
  userType?: string;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
}

export interface Subscription {
  plan: string;
  status: string;
  isActive: boolean;
  credits: number;
  tokensUsed: number;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  isSubscribed?: boolean; // Optional, depends on your backend
}

export interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
}

// Context
const AuthContext = createContext<AuthState | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const dispatch = useAppDispatch();
  const reduxSubscription = useAppSelector(selectSubscriptionData);
  const pathname = usePathname();

  const shouldSyncSubscription = (path: string | null | undefined): boolean => {
    if (!path) return false;
    // Limit subscription auto-fetch to subscription-relevant areas
    return (
      path.startsWith("/dashboard/account") ||
      path.startsWith("/dashboard/(quiz)") ||
      path.startsWith("/dashboard/course") ||
      path.startsWith("/dashboard/subscription")
    );
  };

  // Load fresh subscription on session load - non-blocking background fetch
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated' && shouldSyncSubscription(pathname)) {
      // Use background fetch to avoid blocking render
      dispatch(fetchSubscription({ forceRefresh: true, isBackground: true }));
    }
  }, [session?.user?.id, status, dispatch, pathname]); // More specific dependencies

  const refreshUserData = useCallback(async () => {
    try {
      await update();
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  }, [update]);

  const refreshSubscription = useCallback(async () => {
    try {
      // Use background fetch to avoid blocking UI
      await dispatch(fetchSubscription({ forceRefresh: true, isBackground: true })).unwrap();
    } catch (error) {
      console.error("Failed to refresh subscription data:", error);
    }
  }, [dispatch]);

  const syncWithBackend = useCallback(async () => {
    try {
      await dispatch(forceSyncSubscription()).unwrap();
      await update();
    } catch (error) {
      console.error("Failed to sync with backend:", error);
    }
  }, [dispatch, update]);

  const user: User | null = useMemo(() => {
    if (!session?.user) return null;
    
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      credits: session.user.credits || 0,
      creditsUsed: session.user.creditsUsed || 0,
      isAdmin: session.user.isAdmin || false,
      userType: session.user.userType || "FREE",
      subscriptionPlan:
        reduxSubscription?.subscriptionPlan || session.user.subscriptionPlan,
      subscriptionStatus:
        reduxSubscription?.status || session.user.subscriptionStatus,
    };
  }, [session?.user, reduxSubscription?.subscriptionPlan, reduxSubscription?.status]);

  const subscription: Subscription | null = useMemo(() => {
    if (!reduxSubscription) return null;
    
    return {
      plan: reduxSubscription.subscriptionPlan ?? "",
      status: reduxSubscription.status ?? "",
      isActive: reduxSubscription.status === "ACTIVE",
      credits: reduxSubscription.credits ?? 0,
      tokensUsed: reduxSubscription.tokensUsed ?? 0,
      currentPeriodEnd: reduxSubscription.expirationDate ?? null,
      cancelAtPeriodEnd: reduxSubscription.cancelAtPeriodEnd ?? false,
    };
  }, [reduxSubscription]);

  const authState: AuthState = useMemo(() => ({
    user,
    subscription,
    isAuthenticated: !!session?.user,
    isLoading: status === "loading",
    refreshUserData,
    refreshSubscription,
    syncWithBackend,
  }), [user, subscription, session?.user, status, refreshUserData, refreshSubscription, syncWithBackend]);

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
}

// Hooks
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useUser(): User | null {
  return useAuth().user;
}

export function useSubscription(): Subscription | null {
  return useAuth().subscription;
}

export function useAuthStatus(): {
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}
