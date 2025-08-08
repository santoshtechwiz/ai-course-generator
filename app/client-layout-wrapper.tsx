"use client";

import React, { useEffect, useMemo } from "react";
import { ThemeProvider } from "next-themes";
import { GlobalSubscriptionSynchronizer } from "@/components/GlobalSubscriptionSynchronizer";
import QuizProviderWrapper from "@/components/QuizProviderWrapper";

/**
* Unified Client Layout Wrapper
*
* Enhancements:
* - Respects prefers-reduced-motion and sets a class on <html> early
* - Disables transition flicker on theme change
* - Keeps existing QuizProvider integration opt-in via withQuizProvider
*/
export function ClientLayoutWrapper({
children,
withQuizProvider = false,
}: {
children: React.ReactNode;
withQuizProvider?: boolean;
}) {
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

const content = (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    // Prevents transition flickers when switching theme
    disableTransitionOnChange={true}
  >
    <GlobalSubscriptionSynchronizer />
    {children}
  </ThemeProvider>
);

return <div className="client-layout-wrapper">{withQuizProvider ? <QuizProviderWrapper>{content}</QuizProviderWrapper> : content}</div>;
}

export default ClientLayoutWrapper;
