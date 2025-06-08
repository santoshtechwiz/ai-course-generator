"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { v4 as uuidv4 } from 'uuid';

/**
 * Consolidated authentication hook that combines NextAuth session and Redux auth state
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const reduxAuthState = useSelector((state: RootState) => state.auth);
  const guestIdRef = useRef<string | null>(null);
  
  const isAuthenticated = status === "authenticated";
  const userId = session?.user?.id || reduxAuthState?.userId;
  const isLoading = status === "loading" || reduxAuthState?.loading;
  const isAdmin = !!session?.user?.isAdmin || !!reduxAuthState?.user?.isAdmin;
  
  // Generate a consistent guest ID for the current browser session
  const getGuestId = useCallback(() => {
    if (typeof window === 'undefined') return 'server';
    
    // If we already generated an ID, use it
    if (guestIdRef.current) return guestIdRef.current;
    
    // Try to get existing guest ID from session storage first
    let guestId = sessionStorage.getItem('guestUserId');
    
    // If not found in session storage, check local storage (more persistent)
    if (!guestId) {
      guestId = localStorage.getItem('guestUserId');
    }
    
    // Create new one if needed
    if (!guestId) {
      // Use UUID for better uniqueness
      try {
        guestId = `guest_${uuidv4()}`;
      } catch (e) {
        // Fallback to built-in random function
        try {
          guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
        } catch (e) {
          // Final fallback to date-based ID
          guestId = `guest_${Date.now().toString(36)}`;
        }
      }
      
      // Store in both places for redundancy
      try {
        sessionStorage.setItem('guestUserId', guestId);
        localStorage.setItem('guestUserId', guestId);
      } catch (e) {
        console.error("Failed to store guest ID:", e);
      }
    }
    
    // Store in ref for future use
    guestIdRef.current = guestId;
    return guestId;
  }, []);

  // Create a stable guestId that doesn't change during component lifecycle
  const guestId = useMemo(() => {
    if (isAuthenticated) return null;
    return getGuestId();
  }, [isAuthenticated, getGuestId]);

  // Switch to authenticated ID when session loads
  useEffect(() => {
    if (isAuthenticated && userId && window.localStorage) {
      // Migrate any guest progress to the authenticated user
      const guestProgressKeys = Object.keys(localStorage).filter(key => key.startsWith('guest-progress-'));
      
      guestProgressKeys.forEach(key => {
        try {
          // Extract course ID from key
          const courseId = key.replace('guest-progress-', '');
          // Get guest progress
          const guestProgress = localStorage.getItem(key);
          
          if (guestProgress) {
            // Store as user progress
            localStorage.setItem(`user-progress-${userId}-${courseId}`, guestProgress);
            // Clean up guest progress
            localStorage.removeItem(key);
          }
        } catch (e) {
          console.error("Failed to migrate guest progress", e);
        }
      });
    }
  }, [isAuthenticated, userId]);

  // Combine data from both sources
  return {
    isAuthenticated,
    userId,
    isLoading,
    isAdmin,
    user: session?.user || reduxAuthState?.user,
    getGuestId,
    guestId,
    // Include any additional fields from Redux auth state
    role: reduxAuthState?.role || session?.user?.role,
    permissions: reduxAuthState?.permissions,
    // Add session status for more granular control
    status,
    // Add the raw session and reduxAuthState for edge cases
    session,
    reduxAuthState
  };
}

// Export default and named export for backward compatibility
export default useAuth;
