/**
 * Typography System for CourseAI
 *
 * Mobile-first typography scale with consistent sizing and spacing
 */

export const typography = {
  // Display typography - for hero sections and major headings
  display: {
    large:
      'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-none',
    medium:
      'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight',
    small:
      'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-tight',
  },

  // Headings - for section titles and content hierarchy
  heading: {
    h1: 'text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight',
    h2: 'text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight',
    h3: 'text-lg sm:text-xl lg:text-2xl font-semibold leading-snug',
    h4: 'text-base sm:text-lg lg:text-xl font-semibold leading-snug',
    h5: 'text-sm sm:text-base lg:text-lg font-semibold leading-snug',
    h6: 'text-xs sm:text-sm lg:text-base font-semibold leading-snug',
  },

  // Body text - for content and descriptions
  body: {
    large: 'text-base sm:text-lg leading-relaxed',
    medium: 'text-sm sm:text-base leading-relaxed',
    small: 'text-xs sm:text-sm leading-relaxed',
  },

  // Labels and UI text
  label: {
    large: 'text-sm sm:text-base font-medium',
    medium: 'text-xs sm:text-sm font-medium',
    small: 'text-xs font-medium',
  },

  // Captions and helper text
  caption: {
    large: 'text-xs sm:text-sm text-muted-foreground',
    medium: 'text-xs text-muted-foreground',
    small: 'text-xs text-muted-foreground leading-tight',
  },

  // Code and monospace text
  code: {
    inline: 'text-xs sm:text-sm font-mono bg-muted px-1 py-0.5 rounded',
    block: 'text-sm font-mono leading-relaxed',
  },
} as const;

// Helper function to get typography classes
export const getTypography = (
  category: keyof typeof typography,
  variant: string
) => {
  return (
    typography[category]?.[
      variant as keyof (typeof typography)[typeof category]
    ] || ''
  );
};

// Common text patterns
export const textPatterns = {
  // Card titles
  cardTitle: 'text-lg sm:text-xl font-semibold leading-tight',
  cardDescription: 'text-sm sm:text-base text-muted-foreground leading-relaxed',

  // Button text
  buttonLarge: 'text-base sm:text-lg font-medium',
  buttonMedium: 'text-sm sm:text-base font-medium',
  buttonSmall: 'text-xs sm:text-sm font-medium',

  // Form elements
  inputLabel: 'text-sm font-medium text-foreground',
  inputText: 'text-sm sm:text-base',
  inputHelper: 'text-xs text-muted-foreground',
  inputError: 'text-xs text-destructive',

  // Navigation
  navLink: 'text-sm font-medium',
  navTitle: 'text-lg sm:text-xl font-semibold',

  // Status and badges
  badge: 'text-xs font-medium',
  status: 'text-xs sm:text-sm font-medium',

  // Lists and tables
  listItem: 'text-sm sm:text-base leading-relaxed',
  tableHeader:
    'text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide',
  tableCell: 'text-sm sm:text-base',

  // Responsive truncation
  truncate: 'truncate',
  truncateMulti: 'line-clamp-2 sm:line-clamp-3',

  // Screen reader only
  srOnly: 'sr-only',
} as const;
