"use client";

import { useCallback } from "react";
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
 */
export function useAuth() {
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

  // Enhanced login with loading states and error handling
  const login = useCallback(async (provider: string, options?: { callbackUrl?: string }) => {
    try {
      await signIn(provider, { 
        callbackUrl: options?.callbackUrl || "/dashboard",
        // Avoid redirect to prevent page reload, handle in our own code
        redirect: true,
      });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }, []);

  // Enhanced logout that ensures all auth data is cleared
  const logout = useCallback(async (options: { redirect?: boolean; callbackUrl?: string } = {}) => {
    const redirectUrl = options.callbackUrl || "/";
    
    try {
      // Use our optimized logout that handles everything in the correct order
      await optimizedLogout(redirectUrl);
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      
      // Manual cleanup attempt on error
      clearAllAuthData();
      
      // Force navigation if needed
      if (options.redirect !== false && typeof window !== "undefined") {
        window.location.href = redirectUrl;
      }
      return false;
    }
  }, [optimizedLogout, clearAllAuthData]);

  // Stable guest ID implementation
  const getGuestId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;

    let guestId = sessionStorage.getItem(STORAGE_KEYS.GUEST_ID);
    if (!guestId) {
      guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      try {
        sessionStorage.setItem(STORAGE_KEYS.GUEST_ID, guestId);
      } catch (error) {
        console.warn("Failed to store guest ID:", error);
      }
    }
    return guestId;
  }, []);

  // Get current guest ID
  const guestId = typeof window !== "undefined" ? getGuestId() : null;
  
  // Check if the user is an admin
  const isAdmin = !!user?.isAdmin;
  
  // Get the user ID safely
  const userId = user?.id;

  return {
    // Core auth state
    user,
    token,
    status,
    isAuthenticated,
    isLoading,
    isInitialized,
    session,
    
    // Auth actions
    login,
    logout,
    updateUserData,
    
    // Additional utilities
    isAdmin,
    userId,
    guestId,
    getGuestId,
  };
}

export default useAuth;
