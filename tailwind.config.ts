// const { fontFamily } = require("tailwindcss/defaultTheme")

// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   darkMode: ["class"],
//   content: [
//     "./pages/**/*.{ts,tsx}",
//     "./components/**/*.{ts,tsx}",
//     "./app/**/*.{ts,tsx}",
//     "./src/**/*.{ts,tsx}",
//     "*.{js,ts,jsx,tsx,mdx}",
//   ],
//   theme: {
//     container: {
//       center: true,
//       padding: {
//         DEFAULT: "1rem",
//         sm: "2rem",
//         lg: "4rem",
//         xl: "5rem",
//         "2xl": "6rem",
//       },
//       screens: {
//         sm: "640px",
//         md: "768px",
//         lg: "1024px",
//         xl: "1280px",
//         "2xl": "1536px",
//       },
//     },
//     extend: {
//       fontFamily: {
//         sans: ["var(--font-sans)", "Plus Jakarta Sans", ...fontFamily.sans],
//         heading: ["var(--font-heading)", "Plus Jakarta Sans", ...fontFamily.sans],
//       },
//       fontSize: {
//         "2xs": ["0.625rem", { lineHeight: "1rem" }],
//         "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
//         "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
//         "5xl": ["3rem", { lineHeight: "1" }],
//         "6xl": ["3.75rem", { lineHeight: "1" }],
//         "7xl": ["4.5rem", { lineHeight: "1" }],
//         "8xl": ["6rem", { lineHeight: "1" }],
//         "9xl": ["8rem", { lineHeight: "1" }],
//       },
//       spacing: {
//         "page-top": "2rem",
//         "page-bottom": "4rem",
//         "section-y": "3rem",
//       },
//       maxWidth: {
//         content: "1200px",
//         "8xl": "88rem",
//         "9xl": "96rem",
//       },
//       colors: {
//         border: "hsl(var(--border))",
//         input: "hsl(var(--input))",
//         ring: "hsl(var(--ring))",
//         background: "hsl(var(--background))",
//         foreground: "hsl(var(--foreground))",
//         primary: {
//           DEFAULT: "hsl(var(--primary))",
//           foreground: "hsl(var(--primary-foreground))",
//         },
//         secondary: {
//           DEFAULT: "hsl(var(--secondary))",
//           foreground: "hsl(var(--secondary-foreground))",
//         },
//         destructive: {
//           DEFAULT: "hsl(var(--destructive))",
//           foreground: "hsl(var(--destructive-foreground))",
//         },
//         muted: {
//           DEFAULT: "hsl(var(--muted))",
//           foreground: "hsl(var(--muted-foreground))",
//         },
//         accent: {
//           DEFAULT: "hsl(var(--accent))",
//           foreground: "hsl(var(--accent-foreground))",
//         },
//         popover: {
//           DEFAULT: "hsl(var(--popover))",
//           foreground: "hsl(var(--popover-foreground))",
//         },
//         card: {
//           DEFAULT: "hsl(var(--card))",
//           foreground: "hsl(var(--card-foreground))",
//         },
//       },
//       borderRadius: {
//         lg: "var(--radius)",
//         md: "calc(var(--radius) - 2px)",
//         sm: "calc(var(--radius) - 4px)",
//       },
//       keyframes: {
//         "accordion-down": {
//           from: { height: 0 },
//           to: { height: "var(--radix-accordion-content-height)" },
//         },
//         "accordion-up": {
//           from: { height: "var(--radix-accordion-content-height)" },
//           to: { height: 0 },
//         },
//         "fade-in": {
//           "0%": { opacity: 0 },
//           "100%": { opacity: 1 },
//         },
//         "fade-out": {
//           "0%": { opacity: 1 },
//           "100%": { opacity: 0 },
//         },
//         "slide-in": {
//           "0%": { transform: "translateY(100%)" },
//           "100%": { transform: "translateY(0)" },
//         },
//       },
//       animation: {
//         "accordion-down": "accordion-down 0.2s ease-out",
//         "accordion-up": "accordion-up 0.2s ease-out",
//         "fade-in": "fade-in 0.5s ease-out",
//         "fade-out": "fade-out 0.5s ease-out",
//         "slide-in": "slide-in 0.5s ease-out",
//       },
//       typography: (theme: (arg0: string) => any[]) => ({
//         DEFAULT: {
//           css: {
//             maxWidth: "65ch",
//             color: "hsl(var(--foreground))",
//             a: {
//               color: "hsl(var(--primary))",
//               "&:hover": {
//                 color: "hsl(var(--primary-foreground))",
//               },
//             },
//             "h1, h2, h3, h4, h5, h6": {
//               color: "hsl(var(--foreground))",
//               fontFamily: theme("fontFamily.heading").join(", "),
//             },
//           },
//         },
//       }),
//     },
//   },
//   plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography"), require("@tailwindcss/forms")],
// }


/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography"), require("@tailwindcss/forms")],
}

