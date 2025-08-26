"use client"

import React, { useEffect, Suspense } from "react";
import { store } from "@/store";
import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { GlobalSubscriptionSynchronizer } from "@/components/GlobalSubscriptionSynchronizer";
import { ModuleLoadingSkeleton } from "./shared/ModuleLoadingSkeleton";

interface ClientLayoutWrapperProps {
  children: React.ReactNode
  session?: any
  withTheme?: boolean
  withSubscriptionSync?: boolean
}

/**
 * Unified Client Layout Wrapper
 * 
 * Comprehensive wrapper that provides all client-side providers and features:
 * - Redux store provider
 * - NextAuth session provider  
 * - Theme provider (optional)
 * - Subscription synchronizer (optional)
 * - Accessibility enhancements (prefers-reduced-motion)
 * 
 * Use withTheme=false for components that don't need theming
 * Use withSubscriptionSync=false for pages that don't need subscription state
 */
export function ClientLayoutWrapper({ 
  children, 
  session, 
  withTheme = true,
  withSubscriptionSync = true
}: ClientLayoutWrapperProps) {
  
  // Add data attributes/classes to the root element for better UX control
  useEffect(() => {
    const root = document.documentElement;

    // mark page loaded to help CSS avoid initial animations if desired
    root.classList.add("page-loaded");

    // respect prefers-reduced-motion
    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia("(prefers-reduced-motion: reduce)");

      const applyReducedMotion = (matches: boolean) => {
        root.classList.toggle("reduce-motion", matches);
      };

      applyReducedMotion(mql.matches);

      // Support both modern and legacy listeners
      const listener = (e: MediaQueryListEvent | MediaQueryList) =>
        applyReducedMotion("matches" in e ? e.matches : (e as MediaQueryList).matches);

      if ("addEventListener" in mql) {
        mql.addEventListener("change", listener as EventListener);
      } else if ("addListener" in mql) {
        // @ts-expect-error - older Safari
        mql.addListener(listener);
      }
    } catch {
      // no-op
    }

    return () => {
      root.classList.remove("page-loaded");
      if (mql) {
        if ("removeEventListener" in mql) {
          mql.removeEventListener("change", () => {});
        } else if ("removeListener" in mql) {
          // @ts-expect-error - older Safari
          mql.removeListener(() => {});
        }
      }
    };
  }, []);

  // Build the provider stack
  let content = (
    <SessionProvider 
      session={session}
      refetchInterval={5 * 60} // 5 minutes
      refetchOnWindowFocus={false}
    >
      <Provider store={store}>
        {withSubscriptionSync && <GlobalSubscriptionSynchronizer />}
        <Suspense fallback={<ModuleLoadingSkeleton />}>
          {children}
        </Suspense>
      </Provider>
    </SessionProvider>
  );

  // Wrap with theme provider if requested
  if (withTheme) {
    content = (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        // Prevents transition flickers when switching theme
        disableTransitionOnChange={true}
      >
        {content}
      </ThemeProvider>
    );
  }

  return <div className="client-layout-wrapper">{content}</div>;
}

export default ClientLayoutWrapper;
