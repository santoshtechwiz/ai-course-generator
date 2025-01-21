/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
	  './pages/**/*.{ts,tsx}',
	  './components/**/*.{ts,tsx}',
	  './app/**/*.{ts,tsx}',
	  './src/**/*.{ts,tsx}',
	],
	theme: {
	  container: {
		center: true,
		padding: "1.5rem", // Adjusted for a more compact design
		screens: {
		  "2xl": "1440px", // Adjusted for a more standard large screen layout
		},
	  },
	  extend: {
		// backgroundImage: {
		// 	"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
		// 	"gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
		//   },
		fontFamily: {
		  sans: ['Roboto', 'sans-serif'], // Roboto for body text
		  serif: ['Lora', 'serif'], // Lora for headings or elegant sections
		},
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
		  lg: "0.75rem", // A bit more rounded for modern UI
		  md: "0.5rem", // Reduced for more subtle rounded effect
		  sm: "0.25rem", // Even smaller for sharp but clean design
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
		  "accordion-down": "accordion-down 0.3s ease-out", // Slightly slower for smoother experience
		  "accordion-up": "accordion-up 0.3s ease-out", // Slightly slower for smoother experience
		},
	  },
	},
	plugins: [
	  require("tailwindcss-animate"),
	  require('@tailwindcss/typography'),
	],
  }
  