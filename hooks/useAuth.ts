import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from './use-toast';

// Hook for managing authentication state and actions
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user is authenticated
  const isAuthenticated = status === 'authenticated';
  
  // Get user data from session
  const user = session?.user || null;
  
  // Redirect to login if not authenticated
  const requireAuth = useCallback(
    (callbackUrl?: string) => {
      if (status === 'loading') {
        setIsLoading(true);
        return;
      }
      
      setIsLoading(false);
      
      if (!isAuthenticated) {
        const redirectUrl = callbackUrl ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/auth/signin';
        router.push(redirectUrl);
        
        toast({
          type: 'info',
          message: 'Please sign in to continue',
          duration: 3000,
        });
      }
    },
    [isAuthenticated, router, status, toast]
  );
  
  // Redirect to dashboard if already authenticated
  const requireGuest = useCallback(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }
    
    setIsLoading(false);
    
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router, status]);
  
  // Update loading state when auth status changes
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);
  
  return {
    user,
    isAuthenticated,
    isLoading: status === 'loading' || isLoading,
    requireAuth,
    requireGuest,
  };
}

export function _createMockUseAuth() {
  // ...mock implementation...
}
