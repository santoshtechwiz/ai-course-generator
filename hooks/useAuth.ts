import { useSession, signIn, signOut } from "next-auth/react"
import { useCallback } from "react"

// Define proper type for the session
interface AuthSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
  expires?: string;
}

// Define return type for useAuth hook
interface UseAuthReturn {
  session: AuthSession | null;
  status: "loading" | "authenticated" | "unauthenticated";
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (options?: any) => Promise<any>;
  signOut: (options?: any) => Promise<any>;
  requireAuth: (callbackUrl?: string) => void;
}

/**
 * Custom hook for authentication state management
 * Provides a simpler, more consistent API for auth operations
 */
export function useAuth(): UseAuthReturn {
  // Use the underlying NextAuth session
  const { data: sessionData, status } = useSession();
  
  // Extract session data with proper type safety
  const session = sessionData as AuthSession | null;
  
  // Derived auth state for easier consumption
  const userId = session?.user?.id || null;
  const userName = session?.user?.name || null;
  const userEmail = session?.user?.email || null;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  
  // Check if user is an admin (implement your own criteria)
  const isAdmin = Boolean(
    isAuthenticated && 
    session?.user?.email &&
    (session.user.email.endsWith('@admin.com') || 
     session.user.email === 'admin@example.com')
  );

  // Helper to require authentication
  const requireAuth = useCallback((callbackUrl?: string) => {
    if (status === "unauthenticated") {
      const options = callbackUrl ? { callbackUrl } : undefined;
      signIn(undefined, options);
    }
  }, [status]);

  return {
    session,
    status,
    userId,
    userName,
    userEmail,
    isLoading,
    isAuthenticated,
    isAdmin,
    signIn,
    signOut,
    requireAuth,
  };
}
