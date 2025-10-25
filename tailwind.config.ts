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
        accent: "var(--color-primary)",
        accentHover: "#e60076",
        card: "var(--color-card)",
        border: "var(--color-border)",
        muted: "var(--color-muted)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-error)",
      },

      boxShadow: {
        neo: "var(--shadow-neo)",
        'neo-sm': "3px 3px 0px var(--shadow-color)",
        'neo-lg': "8px 8px 0px var(--shadow-color)",
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
      const { addComponents } = tw;
      addComponents({
        ".card": {
          "@apply bg-card border-4 border-border shadow-neo p-4 sm:p-5 rounded-lg transition-transform duration-200": {},
          "&:hover": {
            transform: "translateY(-6px)",
          },
        },
        ".btn": {
          "@apply px-4 sm:px-5 py-2 sm:py-3 font-semibold border-4 border-border rounded-md transition-transform duration-200 flex items-center justify-center gap-2": {},
          "&:active": {
            transform: "translate(4px,4px)",
            boxShadow: "none",
          },
        },
        ".btn-accent": {
          "@apply bg-accent text-white shadow-neo": {},
          "&:hover": {
            "@apply bg-accentHover": {},
          },
        },
        ".btn-outline": {
          "@apply bg-transparent text-foreground border-4 border-border shadow-neo": {},
          "&:hover": {
            "@apply bg-foreground text-background": {},
          },
        },
      });
    }),
  ],
};
