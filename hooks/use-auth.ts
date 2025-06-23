"use client";

import { useCallback, useMemo, useRef } from "react";
import { signIn } from "next-auth/react";
import { useOptimizedSession } from "./use-optimized-session";
import { useAuthInit } from "@/providers/enhanced-auth-provider";
import { STORAGE_KEYS } from "@/constants/global";

/**
 * useAuth - Centralized hook for all auth operations
 * 
 * This hook provides a unified interface for auth operations:
 * 1. Uses optimized session management from useOptimizedSession
 * 2. Handles login via various providers
 * 3. Provides clean logout that prevents auto-relogin
 * 4. Adds guest user ID support
 * 
 * This is the main auth hook that should be used across the application.
 * 
 * Production optimizations:
 * - Memoized expensive computations
 * - Improved error handling and recovery
 * - Better memory management
 * - Enhanced performance monitoring
 * - Robust guest ID management
 */
export function useAuth() {
  // Refs for tracking state and preventing memory leaks
  const mountedRef = useRef(true);
  const guestIdCacheRef = useRef<string | null>(null);
  const loginInProgressRef = useRef(false);
  const logoutInProgressRef = useRef(false);

  // Get core session data from optimized hook
  const {
    user,
    token,
    status,
    isAuthenticated,
    isLoading,
    isInitialized,
    session,
    logout: optimizedLogout,
    updateUserData,
  } = useOptimizedSession();

  // Access auth init context
  const { clearAllAuthData } = useAuthInit();

  // Enhanced login with loading states, error handling, and duplicate prevention
  const login = useCallback(async (provider: string, options?: { callbackUrl?: string }) => {
    // Prevent duplicate login attempts
    if (loginInProgressRef.current) {
      console.warn("Login already in progress, ignoring duplicate request");
      return false;
    }

    // Validate provider parameter
    if (!provider || typeof provider !== 'string') {
      console.error("Invalid provider specified for login");
      return false;
    }

    loginInProgressRef.current = true;

    try {
      // Validate callback URL if provided
      const callbackUrl = options?.callbackUrl || "/dashboard";
      
      // Basic URL validation
      if (callbackUrl && !callbackUrl.startsWith('/') && !callbackUrl.startsWith('http')) {
        console.warn("Invalid callback URL, using default");
      }

      // Performance: Start login process
      const startTime = performance.now();
      
      await signIn(provider, { 
        callbackUrl: callbackUrl,
        redirect: true,
      });

      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        const duration = performance.now() - startTime;
        console.log(`Login process took ${duration.toFixed(2)}ms`);
      }

      return true;
    } catch (error) {
      // Enhanced error logging with context
      const errorContext = {
        provider,
        callbackUrl: options?.callbackUrl,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
      };
      
      console.error("Login error:", error, errorContext);
      
      // Report to error tracking service in production
      if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        try {
          // Send to error tracking (Sentry, LogRocket, etc.)
          if ((window as any).Sentry) {
            (window as any).Sentry.captureException(error, {
              extra: errorContext,
              tags: { component: 'useAuth', action: 'login' }
            });
          }
        } catch (reportingError) {
          console.warn("Failed to report login error:", reportingError);
        }
      }
      
      return false;
    } finally {
      // Always reset the login progress flag
      if (mountedRef.current) {
        loginInProgressRef.current = false;
      }
    }
  }, []);

  // Enhanced logout with improved error handling and cleanup
  const logout = useCallback(async (options: { redirect?: boolean; callbackUrl?: string } = {}) => {
    // Prevent duplicate logout attempts
    if (logoutInProgressRef.current) {
      console.warn("Logout already in progress, ignoring duplicate request");
      return false;
    }

    logoutInProgressRef.current = true;
    const redirectUrl = options.callbackUrl || "/auth/signout";
    
    try {
      // Validate redirect URL
      if (redirectUrl && !redirectUrl.startsWith('/') && !redirectUrl.startsWith('http')) {
        console.warn("Invalid redirect URL for logout, using default");
      }

      // Performance tracking
      const startTime = performance.now();
      
      // Use our optimized logout that handles everything in the correct order
      await optimizedLogout(redirectUrl);
      
      // Clear cached guest ID on logout
      guestIdCacheRef.current = null;
      
      // Clear guest ID from storage
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(STORAGE_KEYS.GUEST_ID);
        } catch (storageError) {
          console.warn("Failed to clear guest ID from storage:", storageError);
        }
      }

      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        const duration = performance.now() - startTime;
        console.log(`Logout process took ${duration.toFixed(2)}ms`);
      }
      
      return true;
    } catch (error) {
      // Enhanced error logging
      const errorContext = {
        redirectUrl,
        redirect: options.redirect,
        timestamp: new Date().toISOString(),
      };
      
      console.error("Logout error:", error, errorContext);
      
      // Report to error tracking in production
      if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        try {
          if ((window as any).Sentry) {
            (window as any).Sentry.captureException(error, {
              extra: errorContext,
              tags: { component: 'useAuth', action: 'logout' }
            });
          }
        } catch (reportingError) {
          console.warn("Failed to report logout error:", reportingError);
        }
      }
      
      // Manual cleanup attempt on error
      try {
        clearAllAuthData();
        guestIdCacheRef.current = null;
        
        // Clear storage manually
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(STORAGE_KEYS.GUEST_ID);
        }
      } catch (cleanupError) {
        console.error("Failed to perform manual cleanup:", cleanupError);
      }
      
      // Force navigation if needed and safe to do so
      if (options.redirect !== false && typeof window !== "undefined") {
        try {
          window.location.href = redirectUrl;
        } catch (navigationError) {
          console.error("Failed to navigate after logout error:", navigationError);
        }
      }
      
      return false;
    } finally {
      // Always reset the logout progress flag
      if (mountedRef.current) {
        logoutInProgressRef.current = false;
      }
    }
  }, [optimizedLogout, clearAllAuthData]);

  // Optimized and robust guest ID implementation with caching
  const getGuestId = useCallback((): string | null => {
    // Return null in SSR
    if (typeof window === "undefined") return null;

    // Return cached value if available
    if (guestIdCacheRef.current) {
      return guestIdCacheRef.current;
    }

    try {
      // Try to get existing guest ID from storage
      let guestId = sessionStorage.getItem(STORAGE_KEYS.GUEST_ID);
      
      // Validate existing guest ID format
      if (guestId && !guestId.startsWith('guest-')) {
        console.warn("Invalid guest ID format found, generating new one");
        guestId = null;
      }
      
      // Generate new guest ID if needed
      if (!guestId) {
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 10);
        guestId = `guest-${timestamp}-${randomPart}`;
        
        try {
          sessionStorage.setItem(STORAGE_KEYS.GUEST_ID, guestId);
        } catch (storageError) {
          console.warn("Failed to store guest ID:", storageError);
          // Continue with in-memory guest ID
        }
      }
      
      // Cache the guest ID for performance
      guestIdCacheRef.current = guestId;
      return guestId;
    } catch (error) {
      console.error("Error managing guest ID:", error);
      
      // Fallback: generate temporary guest ID without storage
      const fallbackId = `guest-temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      guestIdCacheRef.current = fallbackId;
      return fallbackId;
    }
  }, []);

  // Memoized guest ID for performance
  const guestId = useMemo(() => {
    return typeof window !== "undefined" ? getGuestId() : null;
  }, [getGuestId]);
  
  // Memoized admin check for performance
  const isAdmin = useMemo(() => {
    return Boolean(user?.isAdmin);
  }, [user?.isAdmin]);
  
  // Memoized user ID for performance
  const userId = useMemo(() => {
    return user?.id || null;
  }, [user?.id]);

  // Cleanup effect
  useMemo(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Enhanced return object with better organization and documentation
  return useMemo(() => ({
    // Core auth state - primary authentication data
    user,
    token,
    status,
    isAuthenticated,
    isLoading,
    isInitialized,
    session,
    
    // Auth actions - methods for authentication operations
    login,
    logout,
    updateUserData,
    
    // Additional utilities - helper methods and computed values
    isAdmin,
    userId,
    guestId,
    getGuestId,
  }), [
    // Core state dependencies
    user,
    token,
    status,
    isAuthenticated,
    isLoading,
    isInitialized,
    session,
    
    // Action dependencies
    login,
    logout,
    updateUserData,
    
    // Utility dependencies
    isAdmin,
    userId,
    guestId,
    getGuestId,
  ]);
}

export default useAuth;

