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
        background: "#fffdf5", // --color-bg
        foreground: "#0a0a0a", // --color-text
        accent: "#ff007f", // --color-primary (neobrutal pink)
        accentHover: "#e60076",
        card: "#ffffff", // --color-card
        border: "#000000", // --color-border
        muted: "#f2f2f2", // --color-muted
        success: "#00b341", // --color-success
        warning: "#ffb300",
        danger: "#ff3b3b",

        // Dark mode
        darkBackground: "#1a1a1a", // matches .dark in globals.css
        darkForeground: "#fafafa",
        darkCard: "#2b2b2b",
        darkBorder: "#fafafa",
      },

      boxShadow: {
        neo: "6px 6px 0px #111",
        neoDark: "6px 6px 0px #fff",
      },

      borderRadius: {
        lg: "16px",
        md: "10px",
        sm: "6px",
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
          "@apply bg-card border-4 border-border shadow-neo p-5 rounded-lg transition-transform duration-200": {},
          "&:hover": {
            transform: "translateY(-6px)",
          },
        },
        ".btn": {
          "@apply px-5 py-3 font-semibold border-4 border-border rounded-md transition-transform duration-200": {},
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
