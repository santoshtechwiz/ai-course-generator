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
        // Neobrutal base palette
        background: "#f5f5f5",
        foreground: "#111",
        accent: "#2563eb", // royal blue pop
        accentHover: "#1e40af",
        card: "#ffffff",
        border: "#111",
        muted: "#888",
        success: "#16a34a",
        danger: "#dc2626",

        // Dark mode
        darkBackground: "#0e0e0e",
        darkForeground: "#f5f5f5",
        darkCard: "#1a1a1a",
        darkBorder: "#fff",
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
    plugin(function ({ addComponents }) {
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
