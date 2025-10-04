// Mobile-First Typography System
// Responsive classes for consistent text scaling across breakpoints

export const typography = {
  // Headings - Mobile-first responsive scaling
  h1: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight",
  h2: "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight",
  h3: "text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight",
  h4: "text-base sm:text-lg md:text-xl lg:text-2xl font-semibold",
  h5: "text-sm sm:text-base md:text-lg font-semibold",
  h6: "text-xs sm:text-sm md:text-base font-semibold",

  // Body text - Responsive scaling
  body: "text-sm sm:text-base lg:text-lg leading-relaxed",
  bodyLarge: "text-base sm:text-lg lg:text-xl leading-relaxed",
  bodySmall: "text-xs sm:text-sm leading-relaxed",

  // Special text types
  caption: "text-xs sm:text-sm text-muted-foreground",
  overline: "text-xs sm:text-sm font-medium uppercase tracking-wider",
  
  // Interactive text
  link: "text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors",
  
  // Code and technical
  code: "font-mono text-xs sm:text-sm bg-muted px-1.5 py-0.5 rounded",
  pre: "font-mono text-xs sm:text-sm bg-muted p-3 sm:p-4 rounded-lg overflow-x-auto",
} as const;

// Responsive Spacing Scale
export const spacing = {
  // Container padding - Mobile-first
  container: "px-3 sm:px-4 lg:px-6 xl:px-8",
  containerY: "py-4 sm:py-6 lg:py-8",
  
  // Component spacing
  componentY: "py-3 sm:py-4 lg:py-6",
  componentX: "px-3 sm:px-4 lg:px-6",
  
  // Section spacing
  sectionY: "py-8 sm:py-12 lg:py-16 xl:py-20",
  sectionX: "px-4 sm:px-6 lg:px-8",
  
  // Gap spacing
  gapSm: "gap-2 sm:gap-3",
  gapMd: "gap-3 sm:gap-4 lg:gap-6",
  gapLg: "gap-4 sm:gap-6 lg:gap-8",
  
  // Stack spacing
  stackSm: "space-y-2 sm:space-y-3",
  stackMd: "space-y-3 sm:space-y-4 lg:space-y-6",
  stackLg: "space-y-4 sm:space-y-6 lg:space-y-8",
} as const;

// Button System - Mobile-first with proper touch targets
export const buttons = {
  // Primary buttons
  primary: "inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors",
  
  // Secondary buttons  
  secondary: "inline-flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors",
  
  // Ghost buttons
  ghost: "inline-flex items-center justify-center rounded-lg hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors",
  
  // Outline buttons
  outline: "inline-flex items-center justify-center rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors",
  
  // Destructive buttons
  destructive: "inline-flex items-center justify-center rounded-lg bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors",
} as const;

// Button Sizes - Mobile-first with WCAG AA touch targets
export const buttonSizes = {
  // Default - WCAG AA compliant (44px minimum)
  default: "h-11 px-4 py-2 text-sm sm:text-base min-h-[44px] min-w-[44px]",
  
  // Small - Still touch-friendly
  sm: "h-10 px-3 py-1.5 text-xs sm:text-sm min-h-[40px] min-w-[40px]",
  
  // Large - More prominent
  lg: "h-12 px-6 py-3 text-base sm:text-lg min-h-[48px]",
  
  // Extra large - Hero buttons
  xl: "h-14 px-8 py-4 text-lg sm:text-xl min-h-[56px]",
  
  // Icon only - Square touch targets
  icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
  iconSm: "h-10 w-10 min-h-[40px] min-w-[40px]",
  iconLg: "h-12 w-12 min-h-[48px] min-w-[48px]",
} as const;

// Card System - Consistent styling
export const cards = {
  // Basic card
  base: "rounded-xl bg-card text-card-foreground shadow-sm border border-border/50",
  
  // Interactive card
  interactive: "rounded-xl bg-card text-card-foreground shadow-sm border border-border/50 hover:shadow-md hover:border-border transition-all duration-200 cursor-pointer",
  
  // Elevated card
  elevated: "rounded-xl bg-card text-card-foreground shadow-lg border border-border/50",
  
  // Glass card
  glass: "rounded-xl backdrop-blur-sm bg-card/80 text-card-foreground shadow-sm border border-border/30",
  
  // Content padding
  padding: "p-4 sm:p-6",
  paddingLg: "p-6 sm:p-8",
  
  // Header styling
  header: "pb-3 sm:pb-4 border-b border-border/50",
  
  // Footer styling
  footer: "pt-3 sm:pt-4 border-t border-border/50",
} as const;

// Layout Utilities
export const layout = {
  // Flex layouts
  flexCol: "flex flex-col",
  flexRow: "flex flex-col sm:flex-row",
  flexCenter: "flex items-center justify-center",
  flexBetween: "flex items-center justify-between",
  
  // Grid layouts - Mobile-first
  grid1: "grid grid-cols-1",
  grid2: "grid grid-cols-1 sm:grid-cols-2",
  grid3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  grid4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  gridAuto: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  
  // Responsive widths
  widthFull: "w-full",
  widthContainer: "w-full max-w-7xl mx-auto",
  widthContent: "w-full max-w-4xl mx-auto",
  widthNarrow: "w-full max-w-2xl mx-auto",
} as const;

// Form System - Mobile-optimized
export const forms = {
  // Input fields
  input: "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]",
  
  // Textarea
  textarea: "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  
  // Select
  select: "flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]",
  
  // Labels
  label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  
  // Field groups
  fieldGroup: "space-y-2",
  fieldRow: "flex flex-col sm:flex-row gap-3 sm:gap-4",
} as const;

// Animation Classes
export const animations = {
  // Fade effects
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up", 
  slideDown: "animate-slide-down",
  
  // Loading states
  pulse: "animate-pulse",
  spin: "animate-spin",
  shimmer: "animate-shimmer",
  
  // Hover effects
  hoverScale: "hover:scale-105 transition-transform duration-200",
  hoverLift: "hover:-translate-y-1 transition-transform duration-200",
  hoverGlow: "hover:shadow-lg transition-shadow duration-200",
} as const;

// Responsive Utilities
export const responsive = {
  // Show/hide by breakpoint
  showSm: "hidden sm:block",
  showMd: "hidden md:block", 
  showLg: "hidden lg:block",
  hideSm: "sm:hidden",
  hideMd: "md:hidden",
  hideLg: "lg:hidden",
  
  // Order utilities
  orderFirst: "order-2 sm:order-1",
  orderLast: "order-1 sm:order-2",
} as const;

export const mobileFirst = {
  typography,
  spacing,
  buttons,
  buttonSizes,
  cards,
  layout,
  forms,
  animations,
  responsive,
} as const;