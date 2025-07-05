import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';

/**
 * Hook for managing user identity, handling both authenticated and guest users
 */
export function useGuestIdentity() {
  const { isAuthenticated, userId } = useAuth();
  const [guestId, setGuestId] = useState<string | null>(null);
  
  // Load or generate guest ID
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      let storedGuestId = localStorage.getItem('guest-identity');
      
      if (!storedGuestId) {
        storedGuestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('guest-identity', storedGuestId);
      }
      
      setGuestId(storedGuestId);
    }
  }, [isAuthenticated]);
  
  // Get current effective user ID (authenticated or guest)
  const getEffectiveUserId = useCallback(() => {
    return isAuthenticated ? userId : guestId;
  }, [isAuthenticated, userId, guestId]);
  
  return {
    isAuthenticated,
    userId,
    guestId,
    getEffectiveUserId
  };
}
