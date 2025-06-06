"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from 'uuid'; // Add this or install it with npm

export function useAuth() {
  const { data: session, status } = useSession();
  const guestIdRef = useRef<string | null>(null);
  
  const isAuthenticated = status === "authenticated";
  const userId = session?.user?.id;
  const isLoading = status === "loading";
  
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
      // First try built-in random function
      try {
        guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
      } catch (e) {
        // Fallback to date-based ID if random fails
        guestId = `guest_${Date.now().toString(36)}`;
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

  return {
    isAuthenticated,
    userId,
    isLoading,
    user: session?.user,
    getGuestId,
    guestId
  };
}
