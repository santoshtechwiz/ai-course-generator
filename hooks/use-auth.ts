"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import { signIn, signOut, getSession, useSession } from "next-auth/react";
import { useAuthInit } from "@/providers/enhanced-auth-provider";
import { STORAGE_KEYS } from "@/constants/global";

/**
 * useAuth - Centralized hook for all auth operations.
 * Updated for production sync issues & best UX practices.
 */
export function useAuth() {
  const mountedRef = useRef(true);
  const guestIdCacheRef = useRef<string | null>(null);
  const loginInProgressRef = useRef(false);
  const logoutInProgressRef = useRef(false);

  // Native next-auth
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const token = (session as any)?.accessToken ?? null;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isInitialized = status !== "loading";

  const { clearAllAuthData } = useAuthInit();

  // --- Login ---
  const login = useCallback(
    async (provider: string, options?: { callbackUrl?: string }) => {
      if (loginInProgressRef.current || !provider) return false;
      loginInProgressRef.current = true;

      try {
        const callbackUrl = options?.callbackUrl || "/dashboard";
        const res = await signIn(provider, {
          callbackUrl,
          redirect: false,
        });

        if (res?.ok && res?.url) {
          await getSession(); // force sync session
          window.location.href = res.url;
        }

        return res?.ok ?? false;
      } catch (error) {
        console.error("Login error:", error);
        return false;
      } finally {
        loginInProgressRef.current = false;
      }
    },
    []
  );

  // --- Logout ---
  const logout = useCallback(
    async (options: { redirect?: boolean; callbackUrl?: string } = {}) => {
      if (logoutInProgressRef.current) return false;
      logoutInProgressRef.current = true;

      const redirectUrl = options.callbackUrl || "/auth/signout";

      try {
        await signOut({ redirect: true, callbackUrl: redirectUrl });
        guestIdCacheRef.current = null;
        sessionStorage.removeItem(STORAGE_KEYS.GUEST_ID);
        return true;
      } catch (error) {
        console.error("Logout error:", error);
        try {
          clearAllAuthData();
          guestIdCacheRef.current = null;
          sessionStorage.removeItem(STORAGE_KEYS.GUEST_ID);
        } catch (cleanupError) {
          console.error("Manual cleanup failed:", cleanupError);
        }
        if (options.redirect !== false && typeof window !== "undefined") {
          window.location.href = redirectUrl;
        }
        return false;
      } finally {
        logoutInProgressRef.current = false;
      }
    },
    [clearAllAuthData]
  );

  // --- Guest ID ---
  const getGuestId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    if (guestIdCacheRef.current) return guestIdCacheRef.current;

    try {
      let guestId = sessionStorage.getItem(STORAGE_KEYS.GUEST_ID);
      if (guestId && !guestId.startsWith("guest-")) {
        console.warn("Invalid guest ID format, regenerating...");
        guestId = null;
      }

      if (!guestId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        guestId = `guest-${timestamp}-${random}`;
        sessionStorage.setItem(STORAGE_KEYS.GUEST_ID, guestId);
      }

      guestIdCacheRef.current = guestId;
      return guestId;
    } catch (err) {
      const fallbackId = `guest-temp-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)}`;
      guestIdCacheRef.current = fallbackId;
      return fallbackId;
    }
  }, []);

  // Memoized values
  const guestId = useMemo(() => {
    return typeof window !== "undefined" ? getGuestId() : null;
  }, [getGuestId]);

  const isAdmin = useMemo(() => Boolean(user?.isAdmin), [user?.isAdmin]);
  const userId = useMemo(() => user?.id || null, [user?.id]);

  // Cleanup ref on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Optional: sync session on tab focus or storage change
  useEffect(() => {
    const syncSession = async () => await getSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("focus", syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("focus", syncSession);
    };
  }, []);

  return useMemo(
    () => ({
      // Session state
      user,
      token,
      status,
      isAuthenticated,
      isLoading,
      isInitialized,
      session,

      // Actions
      login,
      logout,
      updateUserData: async () => await getSession(),

      // Utilities
      isAdmin,
      userId,
      guestId,
      getGuestId,
    }),
    [
      user,
      token,
      status,
      isAuthenticated,
      isLoading,
      isInitialized,
      session,
      login,
      logout,
      isAdmin,
      userId,
      guestId,
      getGuestId,
    ]
  );
}

export default useAuth;
