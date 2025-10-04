import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
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
  const pathname = usePathname();

  const refreshUserData = useCallback(async () => {
    try {
      await update();
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  }, [update]);

  const refreshSubscription = useCallback(async () => {
    try {
      // This will be handled by the unified subscription hook
      // Just refresh the session data
      await update();
    } catch (error) {
      console.error("Failed to refresh subscription data:", error);
    }
  }, [update]);

  const syncWithBackend = useCallback(async () => {
    try {
      // Just refresh session data - subscription sync handled separately
      await update();
    } catch (error) {
      console.error("Failed to sync with backend:", error);
    }
  }, [update]);

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
      subscriptionPlan: session.user.subscriptionPlan,
      subscriptionStatus: session.user.subscriptionStatus,
    };
  }, [session?.user]);

  // Note: Subscription data is now handled by useUnifiedSubscription hook
  // This prevents circular dependencies and provides better separation of concerns
  const subscription: Subscription | null = null;

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

// Note: For subscription data, use useUnifiedSubscription from @/hooks/useUnifiedSubscription
// This prevents circular dependencies
export function useSubscription(): Subscription | null {
  console.warn('useSubscription from AuthProvider is deprecated. Use useUnifiedSubscription instead.')
  return null; // Return null to prevent breaking existing code
}

export function useAuthStatus(): {
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}
