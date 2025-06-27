"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import { signIn, signOut, getSession, useSession } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectIsAuthLoading,
  selectAuth,
  initializeAuth,
  logout as reduxLogout,
} from "@/store/slices/auth-slice";
import { STORAGE_KEYS } from "@/constants/global";
import { AppDispatch } from "@/store";

/**
 * useAuth - Unified hook for auth with session + Redux integration
 */
export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();

  const mountedRef = useRef(true);
  const loginInProgressRef = useRef(false);
  const logoutInProgressRef = useRef(false);

  // Next-auth session
  const { data: session, status } = useSession();

  // Redux state
  const authState = useSelector(selectAuth);
  const reduxIsAuthenticated = useSelector(selectIsAuthenticated);
  const reduxIsLoading = useSelector(selectIsAuthLoading);

  const user = authState.user;
  const token = authState.token;
  const isAuthenticated = reduxIsAuthenticated;
  const isInitialized = authState.isInitialized;
  const isLoading = reduxIsLoading || status === "loading";

  const getGuestId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;

    const existing = sessionStorage.getItem(STORAGE_KEYS.GUEST_ID);
    if (existing?.startsWith("guest-")) return existing;

    const newId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem(STORAGE_KEYS.GUEST_ID, newId);
    return newId;
  }, []);

  const guestId = useMemo(() => getGuestId(), [getGuestId]);
  const userId = useMemo(() => user?.id || null, [user?.id]);
  const isAdmin = useMemo(() => !!user?.isAdmin, [user]);

  const login = useCallback(
    async (provider: string, options?: { callbackUrl?: string }) => {
      if (loginInProgressRef.current || !provider) return false;
      loginInProgressRef.current = true;

      try {
        const callbackUrl = options?.callbackUrl || "/dashboard";
        const res = await signIn(provider, { callbackUrl, redirect: false });

        if (res?.ok && res.url) {
          await getSession();
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

  const logout = useCallback(
    async (options: { redirect?: boolean; callbackUrl?: string } = {}) => {
      if (logoutInProgressRef.current) return false;
      logoutInProgressRef.current = true;

      const redirectUrl = options.callbackUrl || "/auth/signout";

      try {
        await signOut({ redirect: true, callbackUrl: redirectUrl });
        dispatch(reduxLogout());
        sessionStorage.removeItem(STORAGE_KEYS.GUEST_ID);
        return true;
      } catch (err) {
        console.error("Logout error:", err);
        dispatch(reduxLogout());
        sessionStorage.removeItem(STORAGE_KEYS.GUEST_ID);
        if (options.redirect !== false && typeof window !== "undefined") {
          window.location.href = redirectUrl;
        }
        return false;
      } finally {
        logoutInProgressRef.current = false;
      }
    },
    [dispatch]
  );

  // Sync Redux auth state on mount if needed
  useEffect(() => {
    if (!authState.isInitialized) {
      dispatch(initializeAuth());
    }
  }, [authState.isInitialized, dispatch]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isInitialized,
      isLoading,
      login,
      logout,
      userId,
      guestId,
      isAdmin,
      session,
    }),
    [
      user,
      token,
      isAuthenticated,
      isInitialized,
      isLoading,
      login,
      logout,
      userId,
      guestId,
      isAdmin,
      session,
    ]
  );
}
