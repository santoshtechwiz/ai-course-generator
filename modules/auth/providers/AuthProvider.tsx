"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  fetchSubscription,
  forceSyncSubscription,
  selectSubscriptionData,
} from "@/store/slices/subscription-slice";

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

  // Load fresh subscription on session load
  useEffect(() => {
    if (session?.user) {
      dispatch(fetchSubscription({ forceRefresh: true }));
    }
  }, [session?.user, dispatch]);

  const refreshUserData = useCallback(async () => {
    try {
      await update();
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  }, [update]);

  const refreshSubscription = useCallback(async () => {
    try {
      await dispatch(fetchSubscription({ forceRefresh: true })).unwrap();
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

  const user: User | null = session?.user
    ? {
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
      }
    : null;

  const subscription: Subscription | null = reduxSubscription
    ? {
        plan: reduxSubscription.subscriptionPlan ?? "",
        status: reduxSubscription.status ?? "",
        isActive: reduxSubscription.status === "ACTIVE",
        credits: reduxSubscription.credits ?? 0,
        tokensUsed: reduxSubscription.tokensUsed ?? 0,
        currentPeriodEnd: reduxSubscription.expirationDate ?? null,
        cancelAtPeriodEnd: reduxSubscription.cancelAtPeriodEnd ?? false,
      }
    : null;

  const authState: AuthState = {
    user,
    subscription,
    isAuthenticated: !!session?.user,
    isLoading: status === "loading",
    refreshUserData,
    refreshSubscription,
    syncWithBackend,
  };

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
