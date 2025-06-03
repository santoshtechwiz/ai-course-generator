

import { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

// Hook for managing responsive behavior
export function useMobile() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  
  // Get current breakpoint name
  const getBreakpoint = useCallback(() => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  }, [isMobile, isTablet]);
  
  // State to track current breakpoint
  const [breakpoint, setBreakpoint] = useState(getBreakpoint());
  
  // Update breakpoint when media queries change
  useEffect(() => {
    setBreakpoint(getBreakpoint());
  }, [isMobile, isTablet, isDesktop, getBreakpoint]);
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
  };
}
