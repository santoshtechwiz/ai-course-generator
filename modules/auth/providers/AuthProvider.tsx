import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';

// ============= Types =============

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

export interface AuthContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
}

// ============= Context =============

const AuthContext = createContext<AuthContextState | undefined>(undefined);

// ============= Provider =============

/**
 * AuthProvider - Manages authentication state only
 * 
 * Clean separation: handles NextAuth session and user authentication.
 * Subscription data is handled by SubscriptionProvider.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();

  // Refresh user data from NextAuth session
  const refreshUserData = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider] Refreshing user data...');
      }
      await update();
    } catch (error) {
      console.error('[AuthProvider] Failed to refresh user data:', error);
    }
  }, [update]);

  // Build user object from session
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
      userType: session.user.userType || 'FREE',
      subscriptionPlan: session.user.subscriptionPlan,
      subscriptionStatus: session.user.subscriptionStatus,
    };
  }, [session?.user]);

  // Build context state
  const authState: AuthContextState = useMemo(
    () => ({
      user,
      isAuthenticated: !!session?.user,
      isLoading: status === 'loading',
      refreshUserData,
    }),
    [user, session?.user, status, refreshUserData]
  );

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}

// ============= Hook =============

export function useAuthContext(): AuthContextState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
