import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './styles/**/*.css',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        xs: "1.25rem",
        sm: "1.5rem",
        md: "1.75rem",
        lg: "2rem",
        xl: "2rem",
        "2xl": "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      // Enhanced Color System
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary-50))",
          100: "hsl(var(--primary-100))",
          200: "hsl(var(--primary-200))",
          300: "hsl(var(--primary-300))",
          400: "hsl(var(--primary-400))",
          500: "hsl(var(--primary-500))",
          600: "hsl(var(--primary-600))",
          700: "hsl(var(--primary-700))",
          800: "hsl(var(--primary-800))",
          900: "hsl(var(--primary-900))",
          950: "hsl(var(--primary-950))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // AI-themed colors
        ai: {
          purple: "hsl(var(--ai-purple))",
          cyan: "hsl(var(--ai-cyan))",
          neon: "hsl(var(--ai-neon))",
          orange: "hsl(var(--ai-orange))",
        },
        // Enhanced semantic colors
        success: {
          DEFAULT: "hsl(120 60% 50%)",
          foreground: "hsl(120 60% 10%)",
          light: "hsl(120 60% 95%)",
          dark: "hsl(120 60% 20%)",
        },
        warning: {
          DEFAULT: "hsl(38 92% 50%)",
          foreground: "hsl(38 92% 10%)",
          light: "hsl(38 92% 95%)",
          dark: "hsl(38 92% 20%)",
        },
        error: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(0 84% 10%)",
          light: "hsl(0 84% 95%)",
          dark: "hsl(0 84% 20%)",
        },
        info: {
          DEFAULT: "hsl(200 100% 50%)",
          foreground: "hsl(200 100% 10%)",
          light: "hsl(200 100% 95%)",
          dark: "hsl(200 100% 20%)",
        },
        // Enhanced neutral colors
        neutral: {
          50: "hsl(210 20% 98%)",
          100: "hsl(210 20% 95%)",
          200: "hsl(210 16% 93%)",
          300: "hsl(210 14% 89%)",
          400: "hsl(210 14% 83%)",
          500: "hsl(210 11% 71%)",
          600: "hsl(210 7% 56%)",
          700: "hsl(210 9% 31%)",
          800: "hsl(210 10% 23%)",
          900: "hsl(210 11% 15%)",
          950: "hsl(210 12% 8%)",
        },
      },
      // Enhanced Typography
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular"],
        display: ["var(--font-display)", "var(--font-poppins)"],
        heading: ["var(--font-heading)", "var(--font-poppins)"],
        body: ["var(--font-open-sans)", "var(--font-sans)"],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
        // Display sizes
        'display-sm': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        'display-md': ['2.875rem', { lineHeight: '3.25rem', letterSpacing: '-0.025em' }],
        'display-lg': ['3.75rem', { lineHeight: '4.25rem', letterSpacing: '-0.025em' }],
        'display-xl': ['4.5rem', { lineHeight: '5rem', letterSpacing: '-0.025em' }],
        'display-2xl': ['5.625rem', { lineHeight: '6rem', letterSpacing: '-0.025em' }],
      },
      // Enhanced Spacing System
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
        // Responsive spacing utilities
        'section': 'clamp(2rem, 5vw, 6rem)',
        'section-sm': 'clamp(1.5rem, 4vw, 4rem)',
        'section-lg': 'clamp(4rem, 8vw, 8rem)',
        'component': 'clamp(1rem, 3vw, 3rem)',
        'component-sm': 'clamp(0.75rem, 2vw, 2rem)',
        'component-lg': 'clamp(2rem, 4vw, 4rem)',
        // Grid spacing
        'grid-gap': 'clamp(1rem, 2.5vw, 2rem)',
        'grid-gap-sm': 'clamp(0.5rem, 1.5vw, 1rem)',
        'grid-gap-lg': 'clamp(1.5rem, 3vw, 3rem)',
      },
      // Enhanced Border Radius
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      // Enhanced Shadows
      boxShadow: {
        'ai-sm': '0 1px 2px 0 rgba(var(--primary-rgb), 0.05)',
        'ai': '0 1px 3px 0 rgba(var(--primary-rgb), 0.1), 0 1px 2px 0 rgba(var(--primary-rgb), 0.06)',
        'ai-md': '0 4px 6px -1px rgba(var(--primary-rgb), 0.1), 0 2px 4px -1px rgba(var(--primary-rgb), 0.06)',
        'ai-lg': '0 10px 15px -3px rgba(var(--primary-rgb), 0.1), 0 4px 6px -2px rgba(var(--primary-rgb), 0.05)',
        'ai-xl': '0 20px 25px -5px rgba(var(--primary-rgb), 0.1), 0 10px 10px -5px rgba(var(--primary-rgb), 0.04)',
        'ai-2xl': '0 25px 50px -12px rgba(var(--primary-rgb), 0.25)',
        'ai-inner': 'inset 0 2px 4px 0 rgba(var(--primary-rgb), 0.06)',
        'glow': '0 0 20px rgba(var(--primary-rgb), 0.3)',
        'glow-lg': '0 0 40px rgba(var(--primary-rgb), 0.4)',
        'neural': '0 0 20px rgba(var(--primary-rgb), 0.3), 0 0 40px rgba(var(--primary-rgb), 0.2), 0 0 60px rgba(var(--primary-rgb), 0.1)',
      },
      // Core Animations - mobile optimized
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-down": "slide-down 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scale-in 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "pulse-gentle": "pulse-gentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
      },
      // Core Keyframes - mobile optimized
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-gentle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      // Enhanced Backdrop Blur
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      // Enhanced Z-Index
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'max': '9999',
      },
      // Enhanced Aspect Ratios
      aspectRatio: {
        'auto': 'auto',
        'square': '1 / 1',
        'video': '16 / 9',
        'portrait': '3 / 4',
        'landscape': '4 / 3',
        'ultrawide': '21 / 9',
        'golden': '1.618 / 1',
      },
      // Enhanced Grid
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
        '14': 'repeat(14, minmax(0, 1fr))',
        '15': 'repeat(15, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
        'auto-fit': 'repeat(auto-fit, minmax(0, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(0, 1fr))',
      },
      // Enhanced Transforms
      scale: {
        '102': '1.02',
        '103': '1.03',
        '104': '1.04',
        '105': '1.05',
      },
      rotate: {
        '1': '1deg',
        '2': '2deg',
        '3': '3deg',
        '6': '6deg',
        '12': '12deg',
        '45': '45deg',
        '90': '90deg',
        '180': '180deg',
      },
      // Simplified Transitions
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'ease-in-back': 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
        'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'ease-in-circ': 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
        'ease-out-circ': 'cubic-bezier(0.075, 0.82, 0.165, 1)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Custom plugin for AI-themed utilities
    function({ addUtilities, theme }: { addUtilities: any; theme: any }) {
      const newUtilities = {
        // AI Glass Morphism
        '.ai-glass': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        },
        '.ai-glass-dark': {
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.05))',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        },
        // Neural Network Pattern
        '.neural-pattern': {
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(var(--primary-rgb), 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(var(--ai-purple-rgb), 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(var(--ai-cyan-rgb), 0.05) 0%, transparent 50%)
          `,
        },
        // Quantum Border
        '.quantum-border': {
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '-2px',
            background: 'linear-gradient(45deg, rgba(var(--primary-rgb), 0.5), rgba(var(--ai-cyan-rgb), 0.5), rgba(var(--ai-purple-rgb), 0.5))',
            borderRadius: 'inherit',
            zIndex: '-1',
            animation: 'quantum-rotate 4s linear infinite',
            filter: 'blur(6px)',
          },
        },
        // Holographic Text
        '.holographic-text': {
          background: 'linear-gradient(45deg, rgba(var(--primary-rgb), 1), rgba(var(--ai-purple-rgb), 1), rgba(var(--ai-cyan-rgb), 1), rgba(var(--ai-neon-rgb), 1))',
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'holographic 6s ease-in-out infinite',
        },
        // Data Stream Effect
        '.data-stream': {
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-100%',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(180deg, transparent, rgba(var(--ai-neon-rgb), 0.1), transparent)',
            animation: 'data-flow 2s linear infinite',
          },
        },
        // Circuit Board Pattern
        '.circuit-board': {
          backgroundImage: `
            linear-gradient(90deg, rgba(var(--primary-rgb), 0.1) 1px, transparent 1px),
            linear-gradient(rgba(var(--primary-rgb), 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '0',
            backgroundImage: 'radial-gradient(circle at 10px 10px, rgba(var(--ai-cyan-rgb), 0.3) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          },
        },
        // Neon Glow
        '.neon-glow': {
          boxShadow: '0 0 10px rgba(var(--primary-rgb), 0.5), 0 0 20px rgba(var(--primary-rgb), 0.3), 0 0 30px rgba(var(--primary-rgb), 0.1)',
          animation: 'neon-pulse 2s ease-in-out infinite alternate',
        },
        // Matrix Rain Effect
        '.matrix-rain': {
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '"01010101010101010101010101010101010101010101010101010101010101010101010101010101"',
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '200%',
            fontSize: '12px',
            lineHeight: '14px',
            color: 'rgba(var(--ai-neon-rgb), 0.3)',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            animation: 'data-flow 5s linear infinite',
            pointerEvents: 'none',
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
};

export default config;


