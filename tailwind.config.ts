const plugin = require("tailwindcss/plugin");

module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./pages/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neo-Brutalism Design System — aligned to globals.css variables
        background: "var(--color-bg)",
        foreground: "var(--color-text)",
        surface: "var(--color-card)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        "shadow-color": "var(--shadow-color)",

        // Semantic Colors
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",

        // Text Colors
        text: {
          DEFAULT: "var(--color-text)",
          secondary: "var(--color-muted)",
        },

        // Legacy Aliases (for backward compatibility)
        card: "var(--color-card)",
        danger: "var(--color-error)",
      },

      boxShadow: {
        // Neo-Brutalism Shadows
        neo: "3px 3px 0 var(--shadow-color)",
        'neo-hover': "4px 4px 0 var(--shadow-color)",
        'neo-active': "1px 2px 1px 2px 0 var(--shadow-color)",
        'neo-heavy': "8px 8px 0 var(--shadow-color)",
        'neo-sm': "2px 2px 0 var(--shadow-color)",
        'neo-lg': "6px 6px 0 var(--shadow-color)",
      },

      borderWidth: {
        '3': '3px',
        '4': '4px',
        '6': '6px',
      },

      borderRadius: {
        none: "0px", // Sharp corners for Neo-Brutalism
      },

      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
      },

      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },

      fontWeight: {
        black: "900",
        bold: "700",
      },

      screens: {
        xs: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },

  plugins: [
    plugin(function (tw: any) {
      const { addComponents, addUtilities } = tw;

      // Add Neo-Brutalism utility classes
      addUtilities({
        '.neo-border-primary': {
          'border': '6px solid var(--color-border)',
        },
        '.neo-border-secondary': {
          'border': '4px solid var(--color-border)',
        },
        '.neo-border-tertiary': {
          'border': '3px solid var(--color-border)',
        },
        '.neo-shadow': {
          'box-shadow': '3px 3px 0 var(--shadow-color)',
        },
        '.neo-shadow-hover': {
          'box-shadow': '4px 4px 0 var(--shadow-color)',
        },
        '.neo-shadow-active': {
          'box-shadow': '1px 2px 1px 2px 0 var(--shadow-color)',
        },
        '.neo-shadow-heavy': {
          'box-shadow': '8px 8px 0 var(--shadow-color)',
        },
        '.neo-hover-lift': {
          'transition': 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            'transform': 'translate(-2px, -2px)',
            'box-shadow': '4px 4px 0 var(--shadow-color)',
          },
        },
        '.neo-press': {
          'transition': 'transform 0.1s ease, box-shadow 0.1s ease',
          '&:active': {
            'transform': 'translate(1px, 1px)',
            'box-shadow': '1px 2px 1px 2px 0 var(--shadow-color)',
          },
        },
        '.neo-typography-heading': {
          '@apply font-black uppercase tracking-wider': {},
        },
        '.neo-typography-body': {
          '@apply font-bold': {},
        },
        '.focus-ring': {
          '@apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2': {},
        },
      });

      addComponents({
        ".neo-card": {
          "@apply bg-surface border-6 border-border neo-shadow neo-hover-lift rounded-none": {},
        },
        ".neo-button": {
          "@apply inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] font-black uppercase tracking-wider border-4 border-border neo-shadow neo-hover-lift neo-press focus-ring disabled:opacity-50 disabled:cursor-not-allowed": {},
        },
        ".neo-button-primary": {
          "@apply bg-primary text-background": {},
        },
        ".neo-button-secondary": {
          "@apply bg-secondary text-background": {},
        },
        ".neo-button-accent": {
          "@apply bg-accent text-background": {},
        },
        ".neo-input": {
          "@apply bg-surface border-4 border-border neo-shadow rounded-none px-4 py-3 font-bold focus-ring placeholder:text-muted": {},
        },
        ".neo-badge": {
          "@apply inline-flex items-center gap-1 px-3 py-2 text-sm font-black uppercase tracking-wider rounded-none border-3 border-border neo-shadow": {},
        },
        ".neo-modal": {
          "@apply bg-surface border-6 border-border neo-shadow-heavy rounded-none focus-ring": {},
        },
        ".neo-alert": {
          "@apply p-6 rounded-none border-4 neo-shadow": {},
        },
        ".neo-alert-success": {
          "@apply bg-success/10 border-success text-success": {},
        },
        ".neo-alert-warning": {
          "@apply bg-warning/10 border-warning text-warning": {},
        },
        ".neo-alert-error": {
          "@apply bg-error/10 border-error text-error": {},
        },
      });
    }),
  ],
};
