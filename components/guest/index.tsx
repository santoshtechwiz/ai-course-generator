'use client';

import React, { useEffect, useState } from 'react';
import { MigrationWelcome } from './MigrationWelcome';
import { GuestProgressIndicator } from './GuestProgressIndicator';
import { ContextualSignInPrompt } from './ContextualSignInPrompt';

/**
 * Guest Experience Provider Component
 * Orchestrates the complete guest-to-authenticated user experience
 * SSR-safe with hydration guards
 */
export function GuestExperienceProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Prevent SSR/hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return (
    <>
      {children}
      
      {/* Only render client-side components after hydration */}
      {isMounted && (
        <MigrationWelcome />
      )}
    </>
  );
}

// Re-export components for easy access
export {
  MigrationWelcome,
  GuestProgressIndicator,
  ContextualSignInPrompt
};

export { ClientGuestProvider } from './ClientGuestProvider';