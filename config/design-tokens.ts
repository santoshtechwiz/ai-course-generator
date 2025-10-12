/**
 * Design Tokens - Centralized Design System
 * 
 * Single source of truth for colors, typography, spacing, shadows, and other design primitives
 * Usage: import { colors, spacing, typography } from '@/config/design-tokens'
 */

// ========== COLORS ==========
export const colors = {
  // Brand Colors
  brand: {
    primary: 'hsl(221.2 83.2% 53.3%)', // Blue
    primaryHover: 'hsl(221.2 83.2% 45%)',
    secondary: 'hsl(210 40% 96.1%)', // Light blue-gray
    accent: 'hsl(142.1 76.2% 36.3%)', // Green
    accentHover: 'hsl(142.1 76.2% 30%)',
  },

  // Semantic Colors
  success: {
    50: 'hsl(142.1 76.2% 96%)',
    100: 'hsl(142.1 76.2% 85%)',
    500: 'hsl(142.1 76.2% 36.3%)',
    600: 'hsl(142.1 76.2% 30%)',
    700: 'hsl(142.1 76.2% 25%)',
    900: 'hsl(142.1 76.2% 15%)',
  },
  
  warning: {
    50: 'hsl(47.9 95.8% 95%)',
    100: 'hsl(47.9 95.8% 85%)',
    500: 'hsl(47.9 95.8% 53.1%)',
    600: 'hsl(47.9 95.8% 45%)',
    700: 'hsl(47.9 95.8% 35%)',
    900: 'hsl(47.9 95.8% 20%)',
  },
  
  error: {
    50: 'hsl(0 84.2% 96%)',
    100: 'hsl(0 84.2% 85%)',
    500: 'hsl(0 84.2% 60.2%)',
    600: 'hsl(0 84.2% 50%)',
    700: 'hsl(0 84.2% 40%)',
    900: 'hsl(0 84.2% 25%)',
  },
  
  info: {
    50: 'hsl(214.3 31.8% 95%)',
    100: 'hsl(214.3 31.8% 85%)',
    500: 'hsl(214.3 31.8% 51.4%)',
    600: 'hsl(214.3 31.8% 45%)',
    700: 'hsl(214.3 31.8% 35%)',
    900: 'hsl(214.3 31.8% 20%)',
  },

  // Neutral Grays
  gray: {
    50: 'hsl(210 40% 98%)',
    100: 'hsl(210 40% 96.1%)',
    200: 'hsl(214.3 31.8% 91.4%)',
    300: 'hsl(213 27.8% 84.2%)',
    400: 'hsl(215 20.2% 65.1%)',
    500: 'hsl(215 16.3% 46.9%)',
    600: 'hsl(215 19.3% 34.5%)',
    700: 'hsl(215 25% 26.7%)',
    800: 'hsl(217 33% 17%)',
    900: 'hsl(222.2 47.4% 11.2%)',
  },

  // Quiz Type Colors
  quiz: {
    mcq: 'hsl(262.1 83.3% 57.8%)', // Purple
    blanks: 'hsl(47.9 95.8% 53.1%)', // Amber
    openended: 'hsl(142.1 76.2% 36.3%)', // Green
    code: 'hsl(217.2 91.2% 59.8%)', // Blue
    flashcard: 'hsl(346.8 77.2% 49.8%)', // Rose
  },

  // Difficulty Colors
  difficulty: {
    easy: 'hsl(142.1 76.2% 36.3%)', // Green
    medium: 'hsl(47.9 95.8% 53.1%)', // Amber
    hard: 'hsl(0 84.2% 60.2%)', // Red
  },
} as const

// ========== TYPOGRAPHY ==========
export const typography = {
  fontFamily: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
    heading: 'var(--font-sans)',
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// ========== SPACING ==========
export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
  40: '10rem', // 160px
  48: '12rem', // 192px
  56: '14rem', // 224px
  64: '16rem', // 256px
} as const

// ========== SHADOWS ==========
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  
  // Colored shadows for emphasis
  primary: '0 10px 25px -5px hsl(221.2 83.2% 53.3% / 0.3)',
  success: '0 10px 25px -5px hsl(142.1 76.2% 36.3% / 0.3)',
  warning: '0 10px 25px -5px hsl(47.9 95.8% 53.1% / 0.3)',
  error: '0 10px 25px -5px hsl(0 84.2% 60.2% / 0.3)',
} as const

// ========== BORDER RADIUS ==========
export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const

// ========== Z-INDEX ==========
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const

// ========== TRANSITIONS ==========
export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    medium: '300ms',
    slow: '500ms',
  },

  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

// ========== BREAKPOINTS ==========
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ========== COMPONENT-SPECIFIC ==========
export const components = {
  button: {
    height: {
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '3rem', // 48px
    },
    padding: {
      sm: '0.5rem 1rem',
      md: '0.75rem 1.5rem',
      lg: '1rem 2rem',
    },
  },

  card: {
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    },
  },

  input: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
    },
  },

  modal: {
    width: {
      sm: '400px',
      md: '600px',
      lg: '800px',
      xl: '1000px',
      full: '90vw',
    },
  },
} as const

// ========== ANIMATION VARIANTS ==========
export const animations = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },

  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },

  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },

  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },

  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },

  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },

  rotate: {
    hidden: { opacity: 0, rotate: -10 },
    visible: { opacity: 1, rotate: 0 },
  },
} as const

// ========== UTILITY FUNCTIONS ==========
export const utils = {
  /**
   * Get a color with opacity
   * @param color - HSL color string
   * @param opacity - Opacity value (0-1)
   */
  withOpacity: (color: string, opacity: number): string => {
    return color.replace(')', ` / ${opacity})`)
  },

  /**
   * Generate responsive value object for Tailwind
   */
  responsive: <T>(values: {
    base: T
    sm?: T
    md?: T
    lg?: T
    xl?: T
    '2xl'?: T
  }) => values,

  /**
   * Create gradient string
   */
  gradient: (from: string, to: string, direction: string = 'to right'): string => {
    return `linear-gradient(${direction}, ${from}, ${to})`
  },
} as const

// ========== TYPE EXPORTS ==========
export type Color = typeof colors
export type Typography = typeof typography
export type Spacing = typeof spacing
export type Shadow = typeof shadows
export type BorderRadius = typeof borderRadius
export type ZIndex = typeof zIndex
export type Transition = typeof transitions
export type Breakpoint = typeof breakpoints
export type Component = typeof components
export type Animation = typeof animations
