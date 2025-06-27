import { Inter, Roboto } from 'next/font/google'

// Configure Inter font with better fallbacks and optimization
export const fontInterSans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
  preload: true,
  adjustFontFallback: true, // Ensures text doesn't shift
})

// Configure Roboto font with better fallbacks and optimization
export const fontRobotoSans = Roboto({

  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
  preload: true,
  adjustFontFallback: true, // Ensures text doesn't shift
})