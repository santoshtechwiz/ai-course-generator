import { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

// Standardized breakpoint system
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

// Unified breakpoint hook
export const useBreakpoint = (breakpoint: keyof typeof BREAKPOINTS) => {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`);
};

// Hook for managing responsive behavior with standardized breakpoints
export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 767px)'); // Below md
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)'); // md to lg
  const isDesktop = useMediaQuery('(min-width: 1024px)'); // lg and above
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)'); // xl and above
  
  // Get current breakpoint name
  const getBreakpoint = useCallback(() => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    if (isLargeDesktop) return 'large-desktop';
    return 'desktop';
  }, [isMobile, isTablet, isLargeDesktop]);
  
  // State to track current breakpoint
  const [breakpoint, setBreakpoint] = useState(getBreakpoint());
  
  // Update breakpoint when media queries change
  useEffect(() => {
    setBreakpoint(getBreakpoint());
  }, [isMobile, isTablet, isDesktop, isLargeDesktop, getBreakpoint]);
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    breakpoint,
    // Legacy aliases for backward compatibility
    mobile: isMobile,
    tablet: isTablet,
    desktop: isDesktop
  };
}
