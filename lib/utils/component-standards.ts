/**
 * Component Consistency Standards for CourseAI
 * 
 * Standardized component patterns, props, and responsive behaviors
 */

import { type ClassValue } from "clsx";

// Standard component sizing
export const componentSizes = {
  button: {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm", 
    lg: "h-10 px-6 text-base",
    xl: "h-11 px-8 text-lg"
  },
  input: {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-3 text-sm",
    lg: "h-10 px-4 text-base",
    xl: "h-11 px-4 text-lg"
  },
  card: {
    sm: "p-4",
    md: "p-4 sm:p-6", 
    lg: "p-6 sm:p-8",
    xl: "p-8 sm:p-10"
  },
  icon: {
    sm: "h-3 w-3 sm:h-4 sm:w-4",
    md: "h-4 w-4 sm:h-5 sm:w-5",
    lg: "h-5 w-5 sm:h-6 sm:w-6",
    xl: "h-6 w-6 sm:h-8 sm:w-8"
  }
} as const;

// Standard responsive patterns
export const responsivePatterns = {
  // Touch targets - minimum 44px for mobile
  touchTarget: "min-h-[44px] touch-manipulation",
  
  // Interactive elements
  interactive: "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  
  // Card hover effects
  cardHover: "transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
  
  // Loading states
  skeleton: "animate-pulse bg-muted rounded",
  
  // Responsive spacing
  spacing: {
    xs: "gap-1 sm:gap-2",
    sm: "gap-2 sm:gap-3",
    md: "gap-3 sm:gap-4",
    lg: "gap-4 sm:gap-6",
    xl: "gap-6 sm:gap-8"
  },
  
  // Container patterns
  container: {
    narrow: "max-w-2xl mx-auto px-3 sm:px-4",
    default: "max-w-4xl mx-auto px-3 sm:px-4 lg:px-6",
    wide: "max-w-6xl mx-auto px-3 sm:px-4 lg:px-6",
    full: "max-w-7xl mx-auto px-3 sm:px-4 lg:px-6"
  }
} as const;

// Standard breakpoint behaviors
export const breakpointBehaviors = {
  // Navigation - hide on mobile, show on desktop
  desktopNav: "hidden lg:flex",
  mobileNav: "flex lg:hidden",
  
  // Content layout
  stackToRow: "flex flex-col sm:flex-row",
  rowToStack: "flex flex-row sm:flex-col",
  
  // Grid patterns
  responsiveGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  denseGrid: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  autoGrid: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  
  // Visibility 
  mobileOnly: "block sm:hidden",
  desktopOnly: "hidden sm:block",
  tabletUp: "hidden md:block"
} as const;

// Component standardization helpers
export interface StandardComponentProps {
  className?: string;
  size?: keyof typeof componentSizes.button;
  responsive?: boolean;
  touchOptimized?: boolean;
}

// Helper to build responsive component classes
export const buildResponsiveClasses = ({
  base,
  size = 'md',
  responsive = true,
  touchOptimized = false,
  hover = true
}: {
  base: ClassValue;
  size?: keyof typeof componentSizes.button;
  responsive?: boolean;
  touchOptimized?: boolean;
  hover?: boolean;
}) => {
  const classes = [base];
  
  if (touchOptimized) {
    classes.push(responsivePatterns.touchTarget);
  }
  
  if (responsive) {
    classes.push(responsivePatterns.interactive);
  }
  
  if (hover) {
    classes.push("hover:bg-accent/80");
  }
  
  return classes.join(" ");
};

// Standard animation durations for consistency
export const animationTimings = {
  fast: "duration-150",
  normal: "duration-200", 
  slow: "duration-300",
  slowest: "duration-500"
} as const;

// Color consistency patterns
export const colorPatterns = {
  interactive: {
    default: "text-foreground hover:text-primary",
    muted: "text-muted-foreground hover:text-foreground",
    accent: "text-primary hover:text-primary/80"
  },
  background: {
    subtle: "bg-muted/30 hover:bg-muted/50",
    card: "bg-card border border-border/50",
    accent: "bg-primary/10 hover:bg-primary/20"
  },
  border: {
    default: "border border-border",
    subtle: "border border-border/30",
    accent: "border border-primary/20"
  }
} as const;