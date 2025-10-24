import type { Config } from "tailwindcss"
import plugin from "tailwindcss/plugin"

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./pages/**/*.{ts,tsx,js,jsx}",
    "./hooks/**/*.{ts,tsx,js,jsx}",
    "./lib/**/*.{ts,tsx,js,jsx}",
  ],
  
  theme: {
    extend: {
      /* ===================================================================
         🎨 NEOBRUTALISM COLOR SYSTEM
         =================================================================== */
      colors: {
        // Core brand colors
        neo: {
          bg: "var(--neo-bg)",
          text: "var(--neo-text)",
          border: "var(--neo-border)",
        },
        
        // Primary palette
        primary: {
          50: "#fef7f7",
          100: "#fdeaea", 
          200: "#fbd5d5",
          300: "#f7b2b2",
          400: "#f18a8a",
          500: "var(--neo-primary)", // #ff006e
          600: "var(--neo-primary-hover)", // #d90058
          700: "#b8004a",
          800: "#9a003e",
          900: "#7f0033",
          DEFAULT: "var(--neo-primary)",
          hover: "var(--neo-primary-hover)",
          light: "var(--neo-primary-light)",
        },
        
        // Secondary palette  
        secondary: {
          50: "#f4f3ff",
          100: "#ebe9fe",
          200: "#d9d6fe",
          300: "#bfb8fd",
          400: "#a191fa",
          500: "var(--neo-secondary)", // #8338ec
          600: "var(--neo-secondary-hover)", // #6c2bd9
          700: "#5b23c7",
          800: "#4c1da4",
          900: "#3f1a85",
          DEFAULT: "var(--neo-secondary)",
          hover: "var(--neo-secondary-hover)",
          light: "var(--neo-secondary-light)",
        },
        
        // Accent palette
        accent: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "var(--neo-accent)", // #00f5d4
          600: "var(--neo-accent-hover)", // #00d4b8
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          DEFAULT: "var(--neo-accent)",
          hover: "var(--neo-accent-hover)",
          light: "var(--neo-accent-light)",
        },
        
        // Surface colors
        card: {
          DEFAULT: "var(--neo-card)",
          hover: "var(--neo-card-hover)",
        },
        
        muted: {
          DEFAULT: "var(--neo-muted)",
          dark: "var(--neo-muted-dark)",
        },
        
        // Status colors
        success: {
          DEFAULT: "var(--neo-success)",
          light: "var(--neo-success-light)",
        },
        warning: {
          DEFAULT: "var(--neo-warning)", 
          light: "var(--neo-warning-light)",
        },
        error: {
          DEFAULT: "var(--neo-error)",
          light: "var(--neo-error-light)",
        },
        info: {
          DEFAULT: "var(--neo-info)",
          light: "var(--neo-info-light)",
        },
        
        // Extended palette
        yellow: "var(--neo-yellow)",
        orange: "var(--neo-orange)",
        lime: "var(--neo-lime)",
        teal: "var(--neo-teal)",
        indigo: "var(--neo-indigo)",
        pink: "var(--neo-pink)",
        
        // Legacy support (for existing components)
        background: "var(--neo-bg)",
        foreground: "var(--neo-text)",
        border: "var(--neo-border)",
      },
      
      /* ===================================================================
         📏 SPACING & SIZING
         =================================================================== */
      spacing: {
        'neo-xs': 'var(--neo-space-xs)',
        'neo-sm': 'var(--neo-space-sm)', 
        'neo-md': 'var(--neo-space-md)',
        'neo-lg': 'var(--neo-space-lg)',
        'neo-xl': 'var(--neo-space-xl)',
      },
      
      /* ===================================================================
         🔳 BORDER RADIUS
         =================================================================== */
      borderRadius: {
        'neo-sm': 'var(--neo-radius-sm)',
        'neo-md': 'var(--neo-radius-md)',
        'neo-lg': 'var(--neo-radius-lg)',
        'neo-xl': 'var(--neo-radius-xl)',
        // Legacy support
        'sm': '6px',
        'md': '10px', 
        'lg': '16px',
        'xl': '20px',
      },
      
      /* ===================================================================
         🖼️ BOX SHADOWS (Neobrutalism Style)
         =================================================================== */
      boxShadow: {
        'neo-sm': 'var(--neo-shadow-sm)',
        'neo-md': 'var(--neo-shadow-md)',
        'neo-lg': 'var(--neo-shadow-lg)',
        'neo-xl': 'var(--neo-shadow-xl)',
        'neo-2xl': 'var(--neo-shadow-2xl)',
        
        // Colored shadows
        'neo-primary': '4px 4px 0 var(--neo-primary)',
        'neo-secondary': '4px 4px 0 var(--neo-secondary)',
        'neo-accent': '4px 4px 0 var(--neo-accent)',
        'neo-success': '4px 4px 0 var(--neo-success)',
        'neo-warning': '4px 4px 0 var(--neo-warning)',
        'neo-error': '4px 4px 0 var(--neo-error)',
        
        // Legacy support
        'neo': '6px 6px 0 var(--neo-border)',
      },
      
      /* ===================================================================
         🖋️ TYPOGRAPHY
         =================================================================== */
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      fontWeight: {
        normal: 'var(--neo-font-weight-normal)',
        bold: 'var(--neo-font-weight-bold)',
        black: 'var(--neo-font-weight-black)',
      },
      
      /* ===================================================================
         🎭 ANIMATIONS & TRANSITIONS
         =================================================================== */
      transitionTimingFunction: {
        'neo-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'neo-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      transitionDuration: {
        'neo-fast': 'var(--neo-transition-fast)',
        'neo-normal': 'var(--neo-transition-normal)', 
        'neo-slow': 'var(--neo-transition-slow)',
      },
      
      animation: {
        'neo-bounce': 'neo-bounce 2s infinite',
        'neo-pulse': 'neo-pulse 2s infinite',
        'neo-wiggle': 'neo-wiggle 1s ease-in-out infinite',
        'neo-slide-in': 'neo-slide-in 0.3s ease-out',
        'neo-slide-up': 'neo-slide-up 0.3s ease-out',
        'neo-scale-in': 'neo-scale-in 0.3s ease-out',
      },
      
      keyframes: {
        'neo-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'neo-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'neo-wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
        'neo-slide-in': {
          'from': { transform: 'translateX(-100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'neo-slide-up': {
          'from': { transform: 'translateY(20px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'neo-scale-in': {
          'from': { transform: 'scale(0.8)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      /* ===================================================================
         📐 BORDER WIDTH
         =================================================================== */
      borderWidth: {
        'neo-sm': 'var(--neo-border-sm)',
        'neo-md': 'var(--neo-border-md)',
        'neo-lg': 'var(--neo-border-lg)',
        'neo-xl': 'var(--neo-border-xl)',
      },
      
      /* ===================================================================
         📱 SCREENS (Enhanced Breakpoints)
         =================================================================== */
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        
        // Height-based breakpoints
        'h-sm': { 'raw': '(min-height: 600px)' },
        'h-md': { 'raw': '(min-height: 768px)' },
        'h-lg': { 'raw': '(min-height: 1024px)' },
        
        // Orientation breakpoints
        'landscape': { 'raw': '(orientation: landscape)' },
        'portrait': { 'raw': '(orientation: portrait)' },
      },
    },
  },
  
  /* ===================================================================
     🔌 PLUGINS
     =================================================================== */
  plugins: [
    // Neobrutalism Component Plugin
    plugin(function({ addComponents, addUtilities, theme }) {
      
      // Enhanced button components
      addComponents({
        '.btn-neo': {
          '@apply neo-btn neo-btn-primary': {},
        },
        '.btn-neo-secondary': {
          '@apply neo-btn neo-btn-secondary': {},
        },
        '.btn-neo-outline': {
          '@apply neo-btn neo-btn-outline': {},
        },
        '.btn-neo-ghost': {
          '@apply neo-btn bg-transparent border-transparent shadow-none hover:bg-muted hover:shadow-neo-md': {},
        },
        
        // Card components
        '.card-neo': {
          '@apply neo-card': {},
        },
        '.card-neo-sm': {
          '@apply neo-card-sm': {},
        },
        '.card-neo-lg': {
          '@apply neo-card-lg': {},
        },
        
        // Form components
        '.input-neo': {
          '@apply neo-input': {},
        },
        '.textarea-neo': {
          '@apply neo-input min-h-[120px] resize-y': {},
        },
        '.select-neo': {
          '@apply neo-input cursor-pointer': {},
        },
        
        // Badge components
        '.badge-neo': {
          '@apply neo-badge neo-badge-primary': {},
        },
        '.badge-neo-outline': {
          '@apply neo-badge bg-transparent text-neo-text': {},
        },
        
        // Quiz-specific components
        '.quiz-option': {
          '@apply neo-quiz-option': {},
        },
        '.quiz-option-selected': {
          '@apply neo-quiz-option-selected': {},
        },
        '.quiz-option-correct': {
          '@apply neo-quiz-option-correct': {},
        },
        '.quiz-option-incorrect': {
          '@apply neo-quiz-option-incorrect': {},
        },
        
        // Progress components
        '.progress-neo': {
          '@apply neo-progress-bar': {},
        },
        '.progress-fill-neo': {
          '@apply neo-progress-fill': {},
        },
      })
      
      // Utility classes
      addUtilities({
        '.text-shadow-neo': {
          'text-shadow': '2px 2px 0 var(--neo-border)',
        },
        '.text-shadow-neo-lg': {
          'text-shadow': '4px 4px 0 var(--neo-border)',
        },
        
        // Transform utilities
        '.transform-neo-hover': {
          'transition': 'transform 200ms ease-out',
          '&:hover': {
            'transform': 'translate(-4px, -4px)',
          },
        },
        '.transform-neo-active': {
          '&:active': {
            'transform': 'translate(2px, 2px)',
          },
        },
        
        // Gradient utilities
        '.bg-gradient-neo': {
          'background': 'linear-gradient(135deg, var(--neo-primary), var(--neo-accent))',
        },
        '.bg-gradient-neo-secondary': {
          'background': 'linear-gradient(135deg, var(--neo-secondary), var(--neo-primary))',
        },
        
        // Border utilities
        '.border-neo': {
          'border-width': 'var(--neo-border-lg)',
          'border-color': 'var(--neo-border)',
        },
        '.border-neo-sm': {
          'border-width': 'var(--neo-border-sm)',
          'border-color': 'var(--neo-border)',
        },
        '.border-neo-xl': {
          'border-width': 'var(--neo-border-xl)',
          'border-color': 'var(--neo-border)',
        },
      })
    }),
    
    // Typography Plugin (if you want to add it)
    // require('@tailwindcss/typography'),
    
    // Forms Plugin (if you want to add it)
    // require('@tailwindcss/forms'),
  ],
}

export default config