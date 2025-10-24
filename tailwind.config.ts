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
        // Neobrutalism core palette — synced with CSS variables
        background: "var(--color-bg)",
        foreground: "var(--color-text)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        card: "var(--color-card)",
        border: "var(--color-border)",
        muted: "var(--color-muted)",
        
        // Status colors
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",

        // Legacy color support for existing components
        accentHover: "#e60076",
        danger: "var(--color-error)",
        darkBackground: "#1a1a1a",
        darkForeground: "#fafafa",
        darkCard: "#2b2b2b",
        darkBorder: "#fafafa",
      },

      boxShadow: {
        // Neobrutalism shadow system
        neo: "var(--shadow-neo)",
        "neo-lg": "var(--shadow-neo-lg)",
        "neo-xl": "var(--shadow-neo-xl)",
        "neo-sm": "2px 2px 0 var(--shadow-color)",
        
        // Legacy shadows for compatibility
        neoDark: "4px 4px 0px #fff",
      },

      borderRadius: {
        // Enhanced radius system
        sm: "0.5rem",
        md: "var(--radius)",
        lg: "var(--radius-lg)", 
        xl: "var(--radius-xl)",
        "2xl": "2.5rem",
      },

      borderWidth: {
        3: "3px",
        5: "5px",
        6: "6px",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },

      fontWeight: {
        black: "var(--font-black)",
        bold: "var(--font-heading)",
        medium: "var(--font-base)",
      },

      spacing: {
        18: "4.5rem",
        88: "22rem",
        "header": "var(--header-height)",
        "sticky": "var(--sticky-offset)",
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
        neo: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },

      animation: {
        "neo-pulse": "neo-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "neo-bounce": "neo-bounce 1s infinite",
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
    plugin(function ({ addComponents, addUtilities, theme }: any) {
      // Enhanced Neobrutalism components
      addComponents({
        // Legacy card support (now uses neo-card classes)
        ".card": {
          "@apply neo-card": {},
        },
        
        // Legacy button support
        ".btn": {
          "@apply neo-button": {},
        },
        ".btn-accent": {
          "@apply neo-button bg-accent text-white": {},
        },
        ".btn-outline": {
          "@apply neo-button-secondary": {},
        },

        // Enhanced responsive container
        ".neo-container": {
          "@apply max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8": {},
        },
      });

      // Utility classes for consistent spacing and layout
      addUtilities({
        ".text-balance": {
          "text-wrap": "balance",
        },
        ".bg-grid": {
          "background-image": `url("data:image/svg+xml,%3csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='%23000000' fill-opacity='0.05' fill-rule='evenodd'%3e%3cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3e%3c/g%3e%3c/svg%3e")`,
        },
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      });
    }),
  ],
};
