import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: "class",
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
    './types/**/*.{js,ts,jsx,tsx}',
    './store/**/*.{js,ts,jsx,tsx}',
    './modules/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
  ],
  // Safelist only critical utilities that may be dynamically generated
  // safelist: [
  //   'animate-spin',
  //   'animate-pulse',
  //   'animate-bounce',
  // ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "1.75rem",
        lg: "2rem",
        xl: "2rem",
        "2xl": "2.5rem",
      },
      screens: {
        "2xl": "1536px",
      },
    },
    screens: {
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
      },
      borderRadius: {
        'xl': "calc(var(--radius) + 4px)",
        'lg': "var(--radius)",
        'md': "calc(var(--radius) - 2px)",
        'sm': "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Fira Code", "monospace"],
        heading: ["var(--font-heading)", "var(--font-poppins)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-poppins)", "Inter", "system-ui", "sans-serif"],
        body: ["var(--font-open-sans)", "var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      // Core Animations - mobile optimized, removed unused
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-down": "slide-down 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "shimmer": "shimmer 2s linear infinite",
        "caret-blink": "caret-blink 1s ease-out infinite",
      },
      // Core Keyframes - mobile optimized, removed unused
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
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
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
      },
      // Typography plugin customization for markdown
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: theme('colors.foreground'),
            '--tw-prose-body': theme('colors.foreground'),
            '--tw-prose-headings': theme('colors.foreground'),
            '--tw-prose-lead': theme('colors.muted.foreground'),
            '--tw-prose-links': theme('colors.primary.DEFAULT'),
            '--tw-prose-bold': theme('colors.foreground'),
            '--tw-prose-counters': theme('colors.muted.foreground'),
            '--tw-prose-bullets': theme('colors.muted.foreground'),
            '--tw-prose-hr': theme('colors.border'),
            '--tw-prose-quotes': theme('colors.foreground'),
            '--tw-prose-quote-borders': theme('colors.border'),
            '--tw-prose-captions': theme('colors.muted.foreground'),
            '--tw-prose-code': theme('colors.foreground'),
            '--tw-prose-pre-code': theme('colors.foreground'),
            '--tw-prose-pre-bg': theme('colors.muted.DEFAULT'),
            '--tw-prose-th-borders': theme('colors.border'),
            '--tw-prose-td-borders': theme('colors.border'),
            
            // Dark mode
            '--tw-prose-invert-body': theme('colors.foreground'),
            '--tw-prose-invert-headings': theme('colors.foreground'),
            '--tw-prose-invert-lead': theme('colors.muted.foreground'),
            '--tw-prose-invert-links': theme('colors.primary.DEFAULT'),
            '--tw-prose-invert-bold': theme('colors.foreground'),
            '--tw-prose-invert-counters': theme('colors.muted.foreground'),
            '--tw-prose-invert-bullets': theme('colors.muted.foreground'),
            '--tw-prose-invert-hr': theme('colors.border'),
            '--tw-prose-invert-quotes': theme('colors.foreground'),
            '--tw-prose-invert-quote-borders': theme('colors.border'),
            '--tw-prose-invert-captions': theme('colors.muted.foreground'),
            '--tw-prose-invert-code': theme('colors.foreground'),
            '--tw-prose-invert-pre-code': theme('colors.foreground'),
            '--tw-prose-invert-pre-bg': theme('colors.muted.DEFAULT'),
            '--tw-prose-invert-th-borders': theme('colors.border'),
            '--tw-prose-invert-td-borders': theme('colors.border'),

            // Custom styles
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            'code': {
              backgroundColor: theme('colors.muted.DEFAULT'),
              padding: '0.25rem 0.375rem',
              borderRadius: theme('borderRadius.sm'),
              fontWeight: '500',
            },
            'pre': {
              backgroundColor: theme('colors.muted.DEFAULT'),
              borderRadius: theme('borderRadius.lg'),
            },
            'a': {
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Simplified plugin for essential utilities only
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        // Neobrutalism utilities for consistent design
        '.brutal-card': {
          border: '3px solid hsl(var(--border))',
          boxShadow: '6px 6px 0px 0px hsl(var(--border))',
        },
        '.brutal-card-lg': {
          border: '4px solid hsl(var(--border))',
          boxShadow: '8px 8px 0px 0px hsl(var(--border))',
        },
        '.brutal-inset': {
          background: 'hsl(var(--muted))',
          border: '2px solid hsl(var(--border))',
          boxShadow: 'inset 2px 2px 0px 0px hsl(var(--border))',
        },
        // Touch-friendly utilities
        '.touch-manipulation': {
          touchAction: 'manipulation',
        },
        // Scrollbar utilities
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
        },
        '.scrollbar-thumb-gray-400': {
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgb(156 163 175)',
            borderRadius: '3px',
          },
        },
        '.scrollbar-track-gray-200': {
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgb(229 231 235)',
          },
        },
        '.scrollbar-thumb-gray-600': {
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgb(75 85 99)',
            borderRadius: '3px',
          },
        },
        '.scrollbar-track-gray-800': {
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgb(31 41 55)',
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
};

export default config;