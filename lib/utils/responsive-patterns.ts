/**
 * Standardized Responsive Patterns for CourseAI
 * 
 * Mobile-first utility patterns for consistent responsive design
 */

export const responsivePatterns = {
  // Container patterns - mobile first
  container: {
    default: "w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6",
    wide: "w-full max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6", 
    narrow: "w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6",
    full: "w-full px-3 sm:px-4 lg:px-6"
  },

  // Grid patterns - mobile first
  grid: {
    responsive: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6",
    dense: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4",
    cards: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6",
    auto: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
  },

  // Flex patterns - mobile first
  flex: {
    stack: "flex flex-col gap-3 sm:gap-4 lg:gap-6",
    row: "flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6",
    center: "flex flex-col items-center justify-center gap-3 sm:gap-4",
    between: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4",
    wrap: "flex flex-wrap items-center gap-2 sm:gap-3"
  },

  // Typography patterns - mobile first
  text: {
    display: "text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-bold tracking-tight",
    h1: "text-2xl sm:text-3xl lg:text-4xl font-bold",
    h2: "text-xl sm:text-2xl lg:text-3xl font-semibold", 
    h3: "text-lg sm:text-xl lg:text-2xl font-semibold",
    h4: "text-base sm:text-lg font-semibold",
    body: "text-sm sm:text-base leading-relaxed",
    small: "text-xs sm:text-sm",
    caption: "text-xs text-muted-foreground"
  },

  // Spacing patterns - mobile first
  spacing: {
    section: "py-6 sm:py-8 lg:py-12 xl:py-16",
    element: "p-3 sm:p-4 lg:p-6",
    card: "p-4 sm:p-6",
    button: "px-4 py-2 sm:px-6 sm:py-3",
    input: "px-3 py-2 sm:px-4 sm:py-3"
  },

  // Touch targets - mobile optimized
  touch: {
    button: "min-h-[44px] touch-manipulation",
    icon: "h-8 w-8 sm:h-9 sm:w-9 touch-manipulation",
    link: "min-h-[44px] flex items-center touch-manipulation"
  },

  // Common layout patterns
  layout: {
    sidebar: "w-full lg:w-80 xl:w-96",
    main: "flex-1 min-w-0",
    header: "sticky top-0 z-50",
    nav: "hidden lg:flex"
  }
} as const;

// Helper function to get responsive pattern
export const getResponsivePattern = (category: keyof typeof responsivePatterns, pattern: string) => {
  return responsivePatterns[category]?.[pattern as keyof typeof responsivePatterns[typeof category]] || '';
};

// Common responsive class combinations
export const responsiveClasses = {
  cardHover: "hover:shadow-md sm:hover:shadow-lg hover:scale-[1.02] transition-all duration-200",
  fadeIn: "opacity-0 animate-in fade-in duration-500",
  slideUp: "translate-y-4 animate-in slide-in-from-bottom duration-500",
  mobileMenu: "fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto",
  overlay: "fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden",
} as const;