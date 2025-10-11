'use client';

import React, { useState, useEffect } from 'react';
import { GuestExperienceProvider } from './index';

/**
 * Client-side wrapper for GuestExperienceProvider
 * Ensures SSR safety by only rendering after hydration
 */
export function ClientGuestProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // During SSR or before hydration, just render children
  if (!isMounted) {
    return <>{children}</>;
  }
  
  // After hydration, wrap with GuestExperienceProvider
  return (
    <GuestExperienceProvider>
      {children}
    </GuestExperienceProvider>
  );
}