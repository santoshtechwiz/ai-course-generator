"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { GlobalSubscriptionSynchronizer } from "@/components/GlobalSubscriptionSynchronizer";
import QuizProviderWrapper from "@/components/QuizProviderWrapper";

/**
 * Unified Client Layout Wrapper
 * 
 * This component provides client-side functionality that's shared across
 * all modules (quiz, course, and landing pages) including:
 * - Theme support with smooth transitions
 * - Subscription state synchronization
 * - Quiz provider for interactive quizzes
 * - Page load transitions
 */
export function ClientLayoutWrapper({ 
  children,
  withQuizProvider = false
}: { 
  children: React.ReactNode,
  withQuizProvider?: boolean 
}) {
  // This effect ensures that the DOM is fully loaded before animations run
  useEffect(() => {
    // Add a class to indicate that the page is loaded
    // This prevents layout shifts during initial render
    document.documentElement.classList.add('page-loaded');
    
    // Clean up function
    return () => {
      document.documentElement.classList.remove('page-loaded');
    };
  }, []);

  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <GlobalSubscriptionSynchronizer />
      {children}
    </ThemeProvider>
  );

  return (
    <div className="client-layout-wrapper">
      {withQuizProvider ? (
        <QuizProviderWrapper>{content}</QuizProviderWrapper>
      ) : (
        content
      )}
    </div>
  );
}

export default ClientLayoutWrapper;
