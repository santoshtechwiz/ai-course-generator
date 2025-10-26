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
        // Neobrutal base palette — aligned to globals.css variables
        background: "var(--color-bg)",
        foreground: "var(--color-text)",
        primary: "var(--color-primary)",
        accent: "var(--color-primary)",
        accentHover: "#e60076",
        card: "var(--color-card)",
        border: "var(--color-border)",
        muted: "var(--color-muted)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-error)",
        dialog: {
          background: "var(--dialog-background)",
          text: "var(--dialog-text)",
          border: "var(--dialog-border)",
        },
      },

      boxShadow: {
        neo: "var(--shadow-neo)",
        'neo-sm': "6px 6px 0px var(--shadow-color)",
        'neo-lg': "12px 12px 0px var(--shadow-color)",
        'neo-xl': "16px 16px 0px var(--shadow-color)",
        'neo-hover': "var(--shadow-neo-hover)",
        'neo-active': "var(--shadow-neo-active)",
        'neo-inset': "var(--shadow-neo-inset)",
      },

      borderWidth: {
        '6': '6px',
        '8': '8px',
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) * 0.67)",
        sm: "calc(var(--radius) * 0.5)",
      },

      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },

      fontSize: {
        'xs': 'var(--font-size-xs)',
        'sm': 'var(--font-size-sm)',
        'base': 'var(--font-size-base)',
        'lg': 'var(--font-size-lg)',
        'xl': 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
      },

      fontWeight: {
        'base': 'var(--font-base)',
        'heading': 'var(--font-heading)',
      },

      lineHeight: {
        'tight': 'var(--line-height-tight)',
        'normal': 'var(--line-height-normal)',
        'relaxed': 'var(--line-height-relaxed)',
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
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

      // Add utility classes for common Nerobrutal patterns
      addUtilities({
        '.neo-border': {
          'border-width': '6px',
          'border-color': 'var(--color-border)',
        },
        '.neo-shadow': {
          'box-shadow': 'var(--shadow-neo)',
        },
        '.neo-shadow-hover': {
          'box-shadow': 'var(--shadow-neo-hover)',
        },
        '.neo-shadow-active': {
          'box-shadow': 'var(--shadow-neo-active)',
        },
        '.neo-transition': {
          'transition': 'all var(--transition-normal)',
        },
        '.neo-hover-lift': {
          'transition': 'transform var(--transition-normal), box-shadow var(--transition-normal)',
          '&:hover': {
            'transform': 'translate(var(--hover-lift), var(--hover-lift))',
            'box-shadow': 'var(--hover-shadow)',
          },
        },
        '.neo-press': {
          'transition': 'transform var(--transition-fast), box-shadow var(--transition-fast)',
          '&:active': {
            'transform': 'translate(var(--active-press), var(--active-press))',
            'box-shadow': 'var(--active-shadow)',
          },
        },
        '.neo-focus': {
          'transition': 'box-shadow var(--transition-fast)',
          '&:focus-visible': {
            'outline': 'none',
            'box-shadow': '0 0 0 var(--focus-ring-width) var(--focus-ring-color)',
          },
        },
      });

      addComponents({
        ".card": {
          "@apply bg-card border-6 border-border shadow-neo p-6 sm:p-8 rounded-lg transition-transform duration-200 neo-hover-lift": {},
        },
        ".btn": {
          "@apply px-6 sm:px-8 py-3 sm:py-4 font-semibold border-6 border-border rounded-md transition-transform duration-200 flex items-center justify-center gap-2 neo-press neo-focus": {},
          "&:active": {
            transform: "translate(6px,6px)",
            boxShadow: "none",
          },
        },
        ".btn-primary": {
          "@apply bg-primary text-white shadow-neo neo-hover-lift": {},
          "&:hover": {
            "@apply bg-accent": {},
          },
        },
        ".btn-secondary": {
          "@apply bg-secondary text-white shadow-neo neo-hover-lift": {},
          "&:hover": {
            "@apply bg-accent": {},
          },
        },
        ".btn-accent": {
          "@apply bg-accent text-white shadow-neo neo-hover-lift": {},
          "&:hover": {
            "@apply bg-primary": {},
          },
        },
        ".btn-outline": {
          "@apply bg-transparent text-foreground border-4 border-border shadow-neo neo-hover-lift": {},
          "&:hover": {
            "@apply bg-foreground text-background": {},
          },
        },
        ".input": {
          "@apply bg-card border-6 border-border px-4 py-3 rounded-none neo-focus neo-transition": {},
          "&::placeholder": {
            "@apply text-muted-foreground/70": {},
          },
        },
        ".badge": {
          "@apply inline-block px-4 py-2 border-6 border-border bg-accent text-white shadow-neo font-bold text-sm neo-hover-lift": {},
        },
        ".modal": {
          "@apply bg-card border-6 border-border shadow-neo rounded-lg neo-focus": {},
        },
        ".overlay": {
          "@apply bg-black/80 backdrop-blur-none": {},
        },
      });
    }),
  ],
};
